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
  static async initiatePayment(amount: number): Promise<PaymentResponse> {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating order with amount:', amount);
      
      // Verify Razorpay script is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded');
      }

      // Create order on your backend
      const response = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise
          currency: RAZORPAY_CONFIG.CURRENCY,
          userId: auth.currentUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      console.log('Order created:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Payment initiation failed');
      }

      return new Promise((resolve, reject) => {
        // Initialize Razorpay payment
        const options = {
          key: RAZORPAY_CONFIG.KEY_ID,
          amount: amount * 100,
          currency: RAZORPAY_CONFIG.CURRENCY,
          name: RAZORPAY_CONFIG.COMPANY_NAME,
          order_id: data.orderId,
          handler: async function (response: any) {
            console.log('Payment successful:', response);
            try {
              // Verify payment on backend
              const verificationResponse = await fetch(`${API_URL}/api/payment/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });

              const verificationData = await verificationResponse.json();
              if (!verificationData.success) {
                reject(new Error('Payment verification failed'));
                return;
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
          modal: {
            ondismiss: function() {
              reject(new Error('Payment cancelled by user'));
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
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