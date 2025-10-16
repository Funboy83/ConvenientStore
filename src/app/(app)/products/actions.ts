
'use server';

import { addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

// This is a simplified version of the form data
type ProductData = {
  name: string;
  description: string;
  barcode: string;
  attributes: {
    key: string;
    value: string;
  }[];
  costPrice?: number;
  sellingPrice?: number;
};

export async function addProduct(productData: ProductData) {
  const { firestore } = initializeFirebase();
  const productsCollection = collection(firestore, 'products');

  try {
    await addDoc(productsCollection, productData);
  } catch (error) {
    console.error('Error adding product:', error);
    // Re-throw a more specific error to be handled by the client
    throw new Error('Failed to create the product in the database.');
  }
}
