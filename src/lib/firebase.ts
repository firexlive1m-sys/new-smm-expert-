import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = firebaseConfigData;
export const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const isFirebaseConfigured = Boolean(firebaseConfigData.projectId && firebaseConfigData.apiKey);

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firestore = getFirestore(app, databaseId);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase initialization warning:', error);
}

// Connection test on boot
if (firestore) {
  getDocFromServer(doc(firestore, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or connectivity.');
    }
  });
}

export { app, firestore, firestore as db, auth };



