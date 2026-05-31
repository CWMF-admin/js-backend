import { createRequire } from 'module';
import admin from 'firebase-admin';

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccount.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  throw error;
}

export default admin;