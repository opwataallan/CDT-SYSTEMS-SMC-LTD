// Decoupled Firebase Module - Firebase is disconnected in favor of WooCommerce and local persistence.
import { CustomerUser } from '../types';

export const auth: any = {
  currentUser: null,
  onAuthStateChanged: (cb: (user: any) => void) => {
    cb(null);
    return () => {};
  },
  signOut: async () => {},
};

export const db: any = null;
export const storage: any = null;
export const googleProvider: any = null;

export const onAuthStateChanged = (authInstance: any, cb: (user: any) => void) => {
  cb(null);
  return () => {};
};

// Fallback DataURL Image Uploader without external Firebase Storage
export const uploadSettingImage = async (file: File, folder: string = 'branding'): Promise<string> => {
  if (!file) throw new Error('No file selected for upload');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const cleanFirestoreData = (data: any): any => data;
export const handleFirestoreError = (err: any): void => {
  console.warn('[Store Service Notice]:', err);
};

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export const saveUserRoleToFirestore = async (_userId: string, _role: string, _email?: string, _name?: string) => {};
export const getUserRoleFromFirestore = async (_userId: string) => null;
export const getUserProfileFromFirestore = async (_userId: string): Promise<CustomerUser | null> => null;
export const saveUserProfileToFirestore = async (_userId: string, _data: any) => {};
export const updateFirestoreOrderStatus = async (_orderNumber: string, _status: string, _note?: string) => {};
