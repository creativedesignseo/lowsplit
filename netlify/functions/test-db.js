import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  try {
    console.log('Testing Supabase Connection...');
    console.log('URL:', process.env.VITE_SUPABASE_URL);
    console.log('Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert({
        amount: 1.00,
        currency: 'EUR',
        status: 'pending',
        stripe_payment_intent_id: 'test_manual_insert_' + Date.now()
      })
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message, details: error })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
