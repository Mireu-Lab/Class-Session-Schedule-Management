import { db, auth } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { Session, Category } from '../types';

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getSessions = async () => {
  const sessionsCol = collection(db, 'sessions');
  try {
    const sessionSnapshot = await getDocs(sessionsCol);
    return sessionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Session[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'sessions');
  }
};

export const addSession = async (session: Omit<Session, 'id'>) => {
  const sessionsCol = collection(db, 'sessions');
  try {
    const docRef = await addDoc(sessionsCol, session);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'sessions');
  }
};

export const updateSession = async (id: string | number, data: Partial<Session>) => {
  const sessionDoc = doc(db, 'sessions', String(id));
  try {
    await updateDoc(sessionDoc, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sessions/${id}`);
  }
};

export const deleteSession = async (id: string | number) => {
  const sessionDoc = doc(db, 'sessions', String(id));
  try {
    await deleteDoc(sessionDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${id}`);
  }
};

export const getCategories = async () => {
  const categoriesCol = collection(db, 'categories');
  try {
    const catSnapshot = await getDocs(categoriesCol);
    return catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as Category[];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'categories');
  }
};

export const saveCategory = async (category: Category) => {
  const catDoc = doc(db, 'categories', category.id);
  try {
    await setDoc(catDoc, {
      name: category.name,
      color: category.color,
      archived: category.archived
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${category.id}`);
  }
};

export const deleteCategory = async (id: string) => {
  const catDoc = doc(db, 'categories', id);
  try {
    await deleteDoc(catDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
};
