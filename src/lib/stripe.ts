import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - replace with your actual publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate that the Stripe publishable key is configured
if (!stripePublishableKey) {
  console.error(
    'Stripe publishable key is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.'
  );
}

// Initialize Stripe outside of component render to avoid recreating the Stripe object
// This follows Stripe's React SDK best practices: https://docs.stripe.com/sdks/stripejs-react
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export const getStripe = () => {
  return stripePromise;
};

// Pricing configuration
export const JOB_PRICING = {
  STANDARD: {
    price: 500,
    label: 'Standard (Worker/Tradesman)',
    description: 'For general tradesmen positions',
    priceId: 'price_1QXXXXXXXXXXXXX', // Replace with actual Stripe price ID
  },
  PREMIUM: {
    price: 1500,
    label: 'Premium (Project Manager, Superintendent, Executive)',
    description: 'For leadership and management positions',
    priceId: 'price_1QXXXXXXXXXXXXX', // Replace with actual Stripe price ID
  },
} as const;

export type JobClassification = keyof typeof JOB_PRICING;
