import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'idea_submitted',
      'idea_status_updated',
      'credit_points_updated',
      'new_reviewer_added',
      'idea_reviewed',
      'system_update',
      'employee_deleted'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  recipientEmployeeNumber: {
    type: String,
    trim: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'reviewer', 'employee', 'all'],
    default: 'all'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Idea', 'Employee', 'User']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ recipientEmployeeNumber: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);