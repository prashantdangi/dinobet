import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function createOrUpdateUserProfile(userId: string, data: any) {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const docRef = await getDoc(doc(db, 'users', userId));
    return docRef.exists() ? docRef.data() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
} 