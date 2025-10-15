
'use server';

import { addDoc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';

type UnitData = {
  name: string;
  abbreviation: string;
};

export async function addUnit(unitData: UnitData) {
  const { firestore } = initializeFirebase();
  const unitsCollection = collection(firestore, 'units');
  try {
    // Using standard awaited addDoc for clearer error handling
    await addDoc(unitsCollection, unitData);
  } catch (error) {
    console.error('Error adding unit:', error);
    throw new Error('Failed to create unit. Check Firestore rules and authentication.');
  }
}

type AttributeData = {
  name: string;
  values: string[];
};

export async function addAttribute(attributeData: AttributeData) {
  const { firestore } = initializeFirebase();
  // Document ID will be the attribute name in lowercase
  const docId = attributeData.name.toLowerCase();
  const attributeRef = doc(firestore, 'productAttributes', docId);

  try {
    // Using standard awaited setDoc. This will create or overwrite.
    await setDoc(attributeRef, { name: attributeData.name, values: attributeData.values });
  } catch (error) {
    console.error('Error adding attribute:', error);
    throw new Error('Failed to create attribute. Check Firestore rules and authentication.');
  }
}

export async function addAttributeValue(attributeName: string, newValue: string) {
    const { firestore } = initializeFirebase();
    const docId = attributeName.toLowerCase();
    const attributeRef = doc(firestore, 'productAttributes', docId);

    try {
        // Atomically add a new value to the "values" array field.
        await updateDoc(attributeRef, {
            values: arrayUnion(newValue)
        });
    } catch (error) {
        console.error('Error adding attribute value:', error);
        throw new Error('Failed to add attribute value. Check Firestore rules and authentication.');
    }
}
