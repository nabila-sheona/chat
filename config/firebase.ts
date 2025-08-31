import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDk6jUaC0QM8ejET0ygML-FENklvnyn8xY',
  authDomain: 'chatapp-343eb.firebaseapp.com',
  projectId: 'chatapp-343eb',
  storageBucket: 'chatapp-343eb.firebasestorage.app',
  messagingSenderId: '332722468592',
  appId: '1:332722468592:web:02d6853818554fcd32f435',
  measurementId: 'G-CG7KVQ5JC2'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // memory persistence, will reset on app restart
