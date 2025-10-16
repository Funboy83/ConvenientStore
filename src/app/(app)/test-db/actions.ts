'use server';

import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function testDbWrite(): Promise<{
  success: boolean;
  docId?: string;
  error?: string;
}> {
  try {
    console.log('Attempting to initialize Firebase...');
    const { firestore } = initializeFirebase();
    console.log('Firebase initialized. Firestore instance obtained.');

    const testCollection = collection(firestore, 'test_writes');
    console.log("Attempting to write to 'test_writes' collection...");

    const docRef = await addDoc(testCollection, {
      message: 'This is a test write from the app.',
      createdAt: serverTimestamp(),
    });

    console.log('Successfully wrote document with ID:', docRef.id);
    return { success: true, docId: docRef.id };
  } catch (error: any) {
    console.error('Error during Firestore write test:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred during the write operation.',
    };
  }
}
