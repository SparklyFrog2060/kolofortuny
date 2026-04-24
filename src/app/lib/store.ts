import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

export interface Challenge {
  id: string;
  text: string;
}

export interface Wheel {
  id: string;
  name: string;
  challenges: Challenge[];
  createdAt: any;
}

const WHEELS_COLLECTION = 'wheels';

export const subscribeWheels = (callback: (wheels: Wheel[]) => void) => {
  const q = query(collection(db, WHEELS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const wheels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Wheel[];
    callback(wheels);
  });
};

export const createWheel = async (name: string) => {
  return await addDoc(collection(db, WHEELS_COLLECTION), {
    name,
    challenges: [
      { id: Math.random().toString(36).substr(2, 9), text: 'Challenge 1' },
      { id: Math.random().toString(36).substr(2, 9), text: 'Challenge 2' },
      { id: Math.random().toString(36).substr(2, 9), text: 'Challenge 3' }
    ],
    createdAt: Timestamp.now()
  });
};

export const deleteWheel = async (id: string) => {
  return await deleteDoc(doc(db, WHEELS_COLLECTION, id));
};

export const updateWheelChallenges = async (wheelId: string, challenges: Challenge[]) => {
  return await updateDoc(doc(db, WHEELS_COLLECTION, wheelId), { challenges });
};

export const renameWheel = async (wheelId: string, newName: string) => {
  return await updateDoc(doc(db, WHEELS_COLLECTION, wheelId), { name: newName });
};
