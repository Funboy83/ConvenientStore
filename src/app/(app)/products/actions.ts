
'use server';

import { addDocumentNonBlocking } from '@/firebase';
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
    // We use the non-blocking version to let the UI update optimistically
    addDocumentNonBlocking(productsCollection, productData);
  } catch (error) {
    console.error('Error adding product:', error);
    // The non-blocking function will handle emitting the permission error.
    // We can re-throw if we want the server action itself to fail.
    throw new Error('Failed to initiate product creation.');
  }
}
