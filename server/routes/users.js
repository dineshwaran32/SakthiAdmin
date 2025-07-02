import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users for leaderboard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { department, search, sortBy = 'creditPoints', sortOrder = 'desc', limit = 100 } = req.query;
    const query = { isActive: true };

    if (department && department !== 'all') {
      query.department = department;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .sort(sort)
      .limit(Number(limit))
      .lean();

    const departments = await User.distinct('department', { isActive: true });

    res.json({
      users,
      departments
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 