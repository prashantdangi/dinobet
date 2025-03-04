export const PAYTM_CONFIG = {
  MID: import.meta.env.VITE_PAYTM_MID || '',
  MERCHANT_KEY: import.meta.env.VITE_PAYTM_MERCHANT_KEY || '',
  WEBSITE: import.meta.env.VITE_PAYTM_WEBSITE || 'DEFAULT',
  CHANNEL_ID: import.meta.env.VITE_PAYTM_CHANNEL_ID || 'WEB',
  INDUSTRY_TYPE_ID: import.meta.env.VITE_PAYTM_INDUSTRY_TYPE_ID || 'Retail',
  CALLBACK_URL: `${window.location.origin}/api/payment/callback`,
}; 