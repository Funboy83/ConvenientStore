
'use server';

import { initializeFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

type ProductAttribute = {
  key: string;
  value: string;
};

type ProductData = {
  name: string;
  description: string;
  barcode: string;
  attributes: ProductAttribute[];
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
