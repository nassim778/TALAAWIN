import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBXEqqloscz7NtkuYr8Cp38hMmBSn4cogY',
  authDomain: 'talaawin.firebaseapp.com',
  projectId: 'talaawin',
  databaseURL: 'https://talaawin-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'talaawin.firebasestorage.app',
  messagingSenderId: '23480297425',
  appId: '1:23480297425:web:7f8383d695100f4be922f0',
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);

export default app;
