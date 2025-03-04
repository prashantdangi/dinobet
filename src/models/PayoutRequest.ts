export interface PayoutRequest {
  id?: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: Date;
  processedAt?: Date;
  approvedBy?: string;
  paymentDetails: {
    upiId: string;
    accountHolderName: string;
    phone: string;
  };
  gameId: string;
  remarks?: string;
} 