import dotenv from 'dotenv';
dotenv.config();

export const RAZORPAY_CONFIG = {
  KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
}; 