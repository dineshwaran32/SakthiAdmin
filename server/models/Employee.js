import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'employee',
    trim: true
  },
  creditPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
// employeeSchema.index({ employeeNumber: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ creditPoints: -1 });

export default mongoose.model('Employee', employeeSchema);