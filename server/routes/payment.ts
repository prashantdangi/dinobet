import express, { Request, Response, Router } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { RAZORPAY_CONFIG } from '../config';

const router: Router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_CONFIG.KEY_ID,
  key_secret: RAZORPAY_CONFIG.KEY_SECRET,
});

interface CreateOrderRequest {
  amount: number;
  currency: string;
  userId: string;
}

interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

// Create order endpoint
router.post(
  '/create-order',
  (req: Request<{}, {}, CreateOrderRequest>, res: Response) => {
    try {
      const { amount, currency, userId } = req.body;

      // Validate request
      if (!amount || !currency || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(amount), // amount in paise
        currency,
        receipt: `rcpt_${userId}_${Date.now()}`,
        notes: {
          userId
        }
      };

      console.log('Creating order with options:', options);

      razorpay.orders.create(options).then(order => {
        console.log('Order created:', order);
        return res.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency
        });
      }).catch(error => {
        throw error;
      });

    } catch (error: any) {
      console.error('Order creation failed:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    }
  }
);

// Verify payment endpoint
router.post(
  '/verify',
  (req: Request<{}, {}, VerifyPaymentRequest>, res: Response) => {
    try {
      const { orderId, paymentId, signature } = req.body;

      // Validate request
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing payment verification parameters'
        });
      }

      // Verify signature
      const text = `${orderId}|${paymentId}`;
      const generated_signature = crypto
        .createHmac('sha256', RAZORPAY_CONFIG.KEY_SECRET)
        .update(text)
        .digest('hex');

      if (generated_signature !== signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Verify payment status
      razorpay.payments.fetch(paymentId).then(payment => {
        if (payment.status !== 'captured') {
          return res.status(400).json({
            success: false,
            message: 'Payment not captured'
          });
        }

        return res.json({
          success: true,
          payment: {
            id: paymentId,
            amount: payment.amount,
            status: payment.status
          }
        });
      }).catch(error => {
        throw error;
      });

    } catch (error: any) {
      console.error('Payment verification failed:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Payment verification failed'
      });
    }
  }
);

// Test endpoint
router.get('/test-connection', (req: Request, res: Response) => {
  razorpay.orders.all({
    count: 1
  }).then(result => {
    res.json({
      success: true,
      message: 'Razorpay connection successful',
      result
    });
  }).catch(error => {
    console.error('Razorpay test failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay connection failed'
    });
  });
});

export default router; 