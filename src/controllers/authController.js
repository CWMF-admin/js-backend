import admin from '../config/firebase.js';
import userRepository from '../repositories/userRepository.js';

const authController = {
  async signup(req, res) {
    try {
      const { email, password, username, firstname, lastname } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({
          error: 'Email, password, and username are required',
        });
      }

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: username,
      });

      const user = await userRepository.createUser({
        uid: userRecord.uid,
        username,
        email,
        firstname,
        lastname,
        role: 'volunteer',
      });

      res.status(201).json({
        message: 'User created successfully',
        user,
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'Email already in use' });
      }
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async login(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: 'Firebase ID token is required',
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);

      res.cookie('session', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600 * 1000,
        path: '/',
      });

      res.status(200).json({
        message: 'Login successful',
        uid: decodedToken.uid,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  },

  async getMe(req, res) {
    try {
      const token =
        req.cookies.session || req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);

      const user = await userRepository.findByUid(decodedToken.uid);

      return res.json(user || {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        username: decodedToken.email?.split('@')[0] || 'user',
        role: 'volunteer',
      });
    } catch (error) {
      console.error('ME endpoint error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  },

  async logout(_req, res) {
    try {
      res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  async getAllUsers(_req, res) {
    try {
      const users = await userRepository.getAll();

      res.status(200).json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Called after Google OAuth (popup or redirect) to sync the Firebase user into the database.
  async handleToken(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'No ID token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const user = await userRepository.upsertUser({
        uid: decodedToken.uid,
        username: decodedToken.name?.replace(/\s+/g, '_').toLowerCase() ||
          decodedToken.email?.split('@')[0] ||
          `user_${decodedToken.uid.substring(0, 8)}`,
        email: decodedToken.email,
        firstname: decodedToken.name?.split(' ')[0] || null,
        lastname: decodedToken.name?.split(' ').slice(1).join(' ') || null,
        role: 'volunteer',
      });

      res.cookie('session', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600 * 1000,
        path: '/',
      });

      res.json({ success: true, user });
    } catch (error) {
      console.error('Token handling error:', error);
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        return res
          .status(400)
          .json({ error: 'Username already exists, please choose another' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

export default authController;
