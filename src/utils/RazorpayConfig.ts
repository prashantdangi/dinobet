export const RAZORPAY_CONFIG = {
  KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  KEY_SECRET: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
  CURRENCY: 'INR',
  COMPANY_NAME: 'Dino Game',
  DESCRIPTION: 'Game Entry Fee',
  THEME_COLOR: '#000000',
  RETRY_ENABLED: true,
  MAX_RETRY_COUNT: 3,
}; 