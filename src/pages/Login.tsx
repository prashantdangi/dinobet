import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupRecaptcha } from '../firebase';
import { Check as PhoneCheck } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const navigate = useNavigate();

  const setupRecaptcha = async (phoneNumber: string) => {
    try {
      // Clear any existing reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      });

      // Get verification code
      const verificationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      
      return verificationResult;
    } catch (error: any) {
      console.error('Recaptcha Error:', error);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      throw new Error(error.message);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Format phone number
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      console.log('Sending code to:', formattedNumber); // Debug log
      
      const result = await setupRecaptcha(formattedNumber);
      setConfirmationResult(result);
      setVerificationId(result.verificationId);
      setStep('verification');
    } catch (error: any) {
      console.error('Send Code Error:', error); // Debug log
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await confirmationResult.confirm(verificationCode);
      navigate('/bet');
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 bg-gray-100 rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <PhoneCheck size={48} className="text-black" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-6">Login to Play</h2>
        
        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md text-gray-500">
                  +91
                </span>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                  className="input flex-1 rounded-l-none"
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter 10-digit mobile number</p>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div id="recaptcha-container"></div>
            
            <button
              type="submit"
              className="btn w-full"
              disabled={loading || phoneNumber.length !== 10}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="input w-full"
                required
                pattern="[0-9]{6}"
                maxLength={6}
              />
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <button
              type="submit"
              className="btn w-full"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-sm text-gray-600 hover:text-black"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}