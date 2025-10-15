
'use server';

import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
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
    addDocumentNonBlocking(unitsCollection, unitData);
  } catch (error) {
    console.error('Error adding unit:', error);
    throw new Error('Failed to initiate unit creation.');
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
    // This will create or overwrite the document.
    // If you want to merge (e.g., add new values without removing old ones), logic needs adjustment.
    setDocumentNonBlocking(attributeRef, { name: attributeData.name, values: attributeData.values }, {});
  } catch (error) {
    console.error('Error adding attribute:', error);
    throw new Error('Failed to initiate attribute creation.');
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
        // This is a blocking operation, so we can't use the non-blocking helper in the same way.
        // For now, we'll rethrow. A more robust implementation would use the permission error emitter.
        throw new Error('Failed to add attribute value.');
    }
}
