import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { groupId, priceAmount, serviceName, userEmail, months } = await req.json();

    if (!priceAmount || !serviceName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${serviceName} - ${months} ${months === 1 ? 'mes' : 'meses'}`,
              description: `Acceso compartido a ${serviceName}`
            },
            unit_amount: Math.round(priceAmount * 100) // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/explore?payment=cancelled`,
      metadata: {
        groupId: groupId || "",
        months: String(months || 1)
      }
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Stripe error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
