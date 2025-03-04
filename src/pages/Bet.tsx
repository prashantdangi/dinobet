import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CoinsIcon as CoinIcon, ArrowRight } from 'lucide-react';
import { createOrUpdateUserProfile } from '../services/UserService';
import { PaymentService } from '../services/PaymentService';

const Bet: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handlePlaceBet = async () => {
    if (!auth.currentUser) {
      setError('Please login to place a bet');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const paymentResponse = await PaymentService.initiatePayment(50);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'Payment failed');
      }

      // Create game session
      const gameId = auth.currentUser.uid;
      const gameData = {
        userId: gameId,
        phoneNumber: auth.currentUser.phoneNumber,
        betAmount: 50,
        startTime: new Date(),
        status: 'active',
        score: 0,
        orderId: paymentResponse.orderId,
        paymentStatus: 'completed',
        paymentTimestamp: new Date(),
      };

      // Update user profile
      await createOrUpdateUserProfile(gameId, {
        lastGameId: gameId,
        totalGamesPlayed: increment(1),
        lastBetAmount: 50,
        lastPaymentId: paymentResponse.orderId,
      });

      // Create game session
      await setDoc(doc(db, 'games', gameId), gameData);
      
      navigate('/game');
    } catch (error: any) {
      console.error('Detailed error:', error);
      setError(error.message || 'Failed to process payment');
      
      // Log failed payment attempt
      if (auth.currentUser) {
        await createOrUpdateUserProfile(auth.currentUser.uid, {
          lastPaymentError: {
            timestamp: new Date(),
            message: error.message,
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-gray-100 rounded-lg shadow-md text-center">
        <div className="flex justify-center mb-6">
          <CoinIcon size={48} className="text-black" />
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Place Your Bet</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">Game Rules</h3>
          
          <ul className="text-left text-sm space-y-2">
            <li>• Entry fee: ₹50</li>
            <li>• Earn ₹1 for every 10 points</li>
            <li>• Survive as long as possible</li>
            <li>• Special obstacle appears after 450 points</li>
            <li>• Winnings paid via UPI</li>
          </ul>
        </div>
        
        <div className="mb-6">
          <p className="text-lg font-bold">Bet Amount: ₹50</p>
          <p className="text-sm text-gray-600 mt-1">Non-refundable entry fee</p>
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <button
          onClick={handlePlaceBet}
          className="btn w-full flex items-center justify-center space-x-2"
          disabled={loading}
        >
          <span>{loading ? 'Processing...' : 'Pay & Play Now'}</span>
          {!loading && <ArrowRight size={16} />}
        </button>
        
        <p className="mt-4 text-xs text-gray-500">
          By placing a bet, you agree to our terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default Bet;