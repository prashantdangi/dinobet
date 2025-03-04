import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface UserProfile {
  lastGameId?: string;
  totalGamesPlayed?: number;
  lastBetAmount?: number;
  totalEarnings?: number;
  phoneNumber?: string;
  email?: string;
  [key: string]: any; // For any additional fields
}

export const createOrUpdateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get existing data
    const userDoc = await getDoc(userRef);
    const existingData = userDoc.exists() ? userDoc.data() : {};
    
    // Merge existing data with new data
    const updatedData = {
      ...existingData,
      ...data,
      updatedAt: new Date(),
    };

    // If document doesn't exist, add createdAt
    if (!userDoc.exists()) {
      updatedData.createdAt = new Date();
    }

    // Update the document
    await setDoc(userRef, updatedData, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}; 