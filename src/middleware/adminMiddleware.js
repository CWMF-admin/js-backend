import userRepository from '../repositories/userRepository.js';

const adminMiddleware = async (req, res, next) => {
  try {
    const dbUser = await userRepository.findByUid(req.user.uid);

    if (!dbUser) {
      return res.status(403).json({ error: 'User not found in database' });
    }

    if (dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

export default adminMiddleware;
