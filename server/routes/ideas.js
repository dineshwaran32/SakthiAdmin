import express from 'express';
import Idea from '../models/Idea.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireAdminOrReviewer } from '../middleware/auth.js';

const router = express.Router();

// Get all ideas with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      department, 
      priority, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problem: { $regex: search, $options: 'i' } },
        { submittedByName: { $regex: search, $options: 'i' } },
        { submittedByEmployeeNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ideas = await Idea.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Idea.countDocuments(query);
    const departments = await Idea.distinct('department', { isActive: true });
    const statuses = ['under_review', 'ongoing', 'approved', 'implemented', 'rejected'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    res.json({
      ideas,
      total,
      departments,
      statuses,
      priorities,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get idea by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea || !idea.isActive) {
      return res.status(404).json({ message: 'Idea not found' });
    }
    res.json(idea);
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update idea status
router.patch('/:id/status', authenticateToken, requireAdminOrReviewer, async (req, res) => {
  try {
    const { status, reviewComments, priority } = req.body;
    const updateData = {
      status,
      reviewedBy: req.user.name,
      reviewedAt: new Date()
    };

    if (reviewComments) {
      updateData.reviewComments = reviewComments;
    }

    if (priority) {
      updateData.priority = priority;
    }

    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Create notification for employee
    await Notification.create({
      type: 'idea_status_updated',
      title: 'Idea Status Updated',
      message: `Your idea "${idea.title}" status has been updated to ${status}`,
      recipientEmployeeNumber: idea.submittedByEmployeeNumber,
      relatedId: idea._id,
      relatedModel: 'Idea'
    });

    // Award credit points if approved or implemented
    if (status === 'approved' || status === 'implemented') {
      const pointsToAward = status === 'implemented' ? 20 : 10;
      await User.findOneAndUpdate(
        { employeeNumber: idea.submittedByEmployeeNumber },
        { $inc: { creditPoints: pointsToAward } }
      );

      // Create notification for credit points
      await Notification.create({
        type: 'credit_points_updated',
        title: 'Credit Points Awarded',
        message: `You have been awarded ${pointsToAward} credit points for your idea "${idea.title}"`,
        recipientEmployeeNumber: idea.submittedByEmployeeNumber
      });
    }

    res.json(idea);
  } catch (error) {
    console.error('Update idea status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get idea statistics
router.get('/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const totalIdeas = await Idea.countDocuments({ isActive: true });
    const underReview = await Idea.countDocuments({ status: 'under_review', isActive: true });
    const approved = await Idea.countDocuments({ status: 'approved', isActive: true });
    const implemented = await Idea.countDocuments({ status: 'implemented', isActive: true });
    
    const statusDistribution = await Idea.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const departmentStats = await Idea.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const monthlyTrends = await Idea.aggregate([
      { $match: { isActive: true, createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalIdeas,
      underReview,
      approved,
      implemented,
      statusDistribution,
      departmentStats,
      monthlyTrends
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;