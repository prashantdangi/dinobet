import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CreditCard, ArrowRight, RefreshCw } from 'lucide-react';
import { createOrUpdateUserProfile } from '../utils/userProfile';
import { PaymentService } from '../services/PaymentService';

interface GameData {
  score: number;
  betAmount: number;
  status: string;
}

const Payout: React.FC = () => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payoutStatus, setPayoutStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  
  const navigate = useNavigate();
  
  // Calculate earnings
  const earnings = gameData ? Math.floor(gameData.score / 10) : 0;
  
  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      if (!auth.currentUser) return;
      
      try {
        const gameDoc = await getDoc(doc(db, 'games', auth.currentUser.uid));
        
        if (gameDoc.exists()) {
          setGameData(gameDoc.data() as GameData);
        } else {
          setError('Game data not found');
        }
      } catch (error) {
        console.error('Error fetching game data:', error);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameData();
  }, []);
  
  const handlePayout = async () => {
    if (!earnings || !auth.currentUser) return;
    
    setPayoutStatus('processing');
    
    try {
      // Initiate payment
      const paymentResponse = await PaymentService.initiatePayment(earnings);
      
      if (!paymentResponse.success || !paymentResponse.txnToken) {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }

      // Process payment
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const success = await PaymentService.processPayment(
        paymentResponse.txnToken,
        orderId,
        earnings
      );

      if (!success) {
        throw new Error('Payment processing failed');
      }

      // Update game status
      await updateDoc(doc(db, 'games', auth.currentUser.uid), {
        status: 'payout_completed',
        payoutAmount: earnings,
        payoutCompletedAt: new Date(),
      });

      // Update user profile
      await createOrUpdateUserProfile(auth.currentUser.uid, {
        totalEarnings: increment(earnings),
        lastPayoutAmount: earnings,
        lastPayoutDate: new Date(),
      });

      setPayoutStatus('completed');
      
    } catch (error: any) {
      console.error('Payout failed:', error);
      setError(error.message || 'Failed to process payout');
      setPayoutStatus('failed');
    }
  };
  
  const handlePlayAgain = () => {
    navigate('/bet');
  };
  
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-8 bg-gray-100 rounded-lg shadow-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/bet')} className="btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-gray-100 rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <CreditCard size={48} className="text-black" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Game Results</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Score:</span>
            <span className="font-bold">{gameData?.score || 0}</span>
          </div>
          
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Bet Amount:</span>
            <span className="font-bold">₹{gameData?.betAmount || 0}</span>
          </div>
          
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Earnings:</span>
            <span className="font-bold">₹{earnings}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Payout:</span>
              <span className="font-bold text-lg">₹{earnings}</span>
            </div>
          </div>
        </div>
        
        {payoutStatus === 'pending' && (
          <form className="space-y-4">
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID for Payout
              </label>
              <input
                id="upiId"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="input w-full"
                required
              />
            </div>
            
            <button
              type="button"
              onClick={handlePayout}
              className="btn w-full flex items-center justify-center space-x-2"
              disabled={!upiId}
            >
              <span>Request Payout</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}
        
        {payoutStatus === 'processing' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
            <p>Processing your payout...</p>
          </div>
        )}
        
        {payoutStatus === 'completed' && (
          <div className="text-center py-4 space-y-4">
            <p className="text-green-600 font-medium">Payout of ₹{earnings} sent to {upiId}</p>
            <p className="text-sm text-gray-600">Transaction ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            
            <button
              onClick={handlePlayAgain}
              className="btn w-full flex items-center justify-center space-x-2 mt-4"
            >
              <RefreshCw size={16} />
              <span>Play Again</span>
            </button>
          </div>
        )}
        
        {payoutStatus === 'failed' && (
          <div className="text-center py-4 space-y-4">
            <p className="text-red-600 font-medium">Payout failed. Please try again later.</p>
            
            <button
              onClick={handlePlayAgain}
              className="btn w-full flex items-center justify-center space-x-2 mt-4"
            >
              <RefreshCw size={16} />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payout;