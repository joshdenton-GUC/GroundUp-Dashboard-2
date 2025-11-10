import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key - replace with your actual publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePublishableKey) {
    console.error('Stripe publishable key is not defined. Please check your .env file.');
    console.error('Current env:', import.meta.env);
    throw new Error('Stripe publishable key is missing. Please configure VITE_STRIPE_PUBLISHABLE_KEY in your .env file.');
  }

  if (!stripePromise) {
    console.log('Initializing Stripe with key:', stripePublishableKey.substring(0, 20) + '...');
    stripePromise = loadStripe(stripePublishableKey);

    // Validate that Stripe loaded successfully
    stripePromise.then((stripe) => {
      if (stripe) {
        console.log('Stripe loaded successfully');
      } else {
        console.error('Stripe failed to load - returned null');
      }
    }).catch((error) => {
      console.error('Stripe loading error:', error);
    });
  }
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
