import { RAZORPAY_CONFIG } from '../utils/RazorpayConfig';
import { auth } from '../firebase';

interface PaymentResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class PaymentService {
  static async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async initiatePayment(amount: number): Promise<PaymentResponse> {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Load Razorpay script if not already loaded
      const isScriptLoaded = await this.loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const orderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: RAZORPAY_CONFIG.CURRENCY,
          userId: auth.currentUser.uid,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay payment
      return new Promise((resolve, reject) => {
        const options = {
          key: RAZORPAY_CONFIG.KEY_ID,
          amount: amount * 100,
          currency: RAZORPAY_CONFIG.CURRENCY,
          name: RAZORPAY_CONFIG.COMPANY_NAME,
          description: 'Game Entry Fee',
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyResponse = await fetch(`${API_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await auth.currentUser!.getIdToken()}`,
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();
              
              if (!verifyData.success) {
                throw new Error('Payment verification failed');
              }

              resolve({
                success: true,
                orderId: response.razorpay_order_id,
              });
            } catch (error) {
              reject(error);
            }
          },
          prefill: {
            name: auth.currentUser.displayName || undefined,
            email: auth.currentUser.email || undefined,
            contact: auth.currentUser.phoneNumber || undefined,
          },
          theme: {
            color: '#000000',
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment cancelled by user'));
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', (response: any) => {
          reject(new Error(response.error.description));
        });
        razorpay.open();
      });

    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        message: error.message || 'Payment initiation failed',
      };
    }
  }
} 