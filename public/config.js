window.LAUNCH_CONFIG = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
  stripePublishableKey: 'YOUR_STRIPE_PUBLISHABLE_KEY',
  prices: { GROW: 299, SCALE: 499 } // kr — must match the amounts used in functions/create-checkout-session.js
};
