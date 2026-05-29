import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHeaders } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Comisión fija de la plataforma por unión a grupo (EUR)
const PLATFORM_FEE = 0.35;

export async function handler(event) {
  const headers = {
    ...corsHeaders(event.headers.origin),
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let user;
  try {
    user = await requireAuth(event);
  } catch (error) {
    return {
      statusCode: error.statusCode || 401,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }

  try {
    // SOLO aceptamos groupId y walletDeducted del cliente.
    // userId y amount NUNCA se aceptan del body — se calculan en el servidor.
    const body = JSON.parse(event.body || '{}');
    const { groupId } = body;
    let walletDeducted = Number(body.walletDeducted) || 0;

    if (!groupId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field: groupId' }),
      };
    }

    // 1. Lookup del grupo
    const { data: group, error: groupError } = await supabase
      .from('subscription_groups')
      .select('id, price_per_slot, max_slots, slots_occupied, status, service_id, services(name)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Grupo no encontrado' }),
      };
    }

    // 2. Validar disponibilidad
    if (group.status !== 'available' || group.slots_occupied >= group.max_slots) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Grupo no disponible' }),
      };
    }

    // 3. Validar que el user no sea ya miembro
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMembership) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Ya eres miembro de este grupo' }),
      };
    }

    // 4. Calcular el precio real en servidor
    const amount = Number(group.price_per_slot) + PLATFORM_FEE;

    // 5. Validar walletDeducted contra el saldo real
    if (walletDeducted < 0) {
      walletDeducted = 0;
    }

    if (walletDeducted > 0) {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', user.id)
        .maybeSingle();

      if (walletError) {
        console.error('[create-group-checkout] wallet lookup error', walletError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Internal error' }),
        };
      }

      const balance = Number(wallet?.balance || 0);
      if (walletDeducted > balance) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Saldo de billetera insuficiente' }),
        };
      }
      if (walletDeducted >= amount) {
        // Si la billetera cubre todo, este endpoint no es el correcto — debe usarse la RPC de wallet
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'La billetera cubre el total: usa la RPC de pago con billetera, no checkout',
          }),
        };
      }
    }

    const cardAmount = amount - walletDeducted;
    const unitAmount = Math.round(cardAmount * 100);

    if (unitAmount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Monto a cobrar inválido' }),
      };
    }

    // 6. URLs fijas — no event.headers.origin
    const baseUrl = process.env.APP_PROD_URL || 'http://localhost:5173';
    const serviceName = group.services?.name || 'Servicio';

    // 7. Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Unirse a grupo: ${serviceName}`,
              description:
                walletDeducted > 0
                  ? `Pago restante (€${walletDeducted.toFixed(2)} pagado con billetera)`
                  : 'Pago completo con tarjeta',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?tab=purchases&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/group/${groupId}?success=false`,
      metadata: {
        type: 'group_join',
        groupId,
        userId: user.id,
        walletDeducted: String(walletDeducted || 0),
        serviceName,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('[create-group-checkout]', error);
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    const message = statusCode < 500 ? error.message : 'Internal error';
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
}
