import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import ideaRoutes from './routes/ideas.js';
import reviewerRoutes from './routes/reviewers.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// MongoDB connection with graceful error handling
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'MONGODB_URI=mongodb+srv://vithack28:vithack28@cluster0.cq6gr.mongodb.net/Kaizen_Idea?retryWrites=true&w=majority&appName=Cluster0', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
    mongoose.connection.on('connected', () => {
      console.log('Connected to DB:', mongoose.connection.name);
    });
    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.log('📝 Running in development mode without database connection');
    console.log('🔧 To connect to MongoDB, please:');
    console.log('   1. Install MongoDB locally, or');
    console.log('   2. Set up a MongoDB Atlas cluster, or');
    console.log('   3. Set the MONGODB_URI environment variable');
    console.log('   4. Run: npm run init-db');
    return false;
  }
};

// Initialize database connection
let isDbConnected = false;

// Routes - only mount if database is connected
const setupRoutes = () => {
  if (isDbConnected) {
    app.use('/api/admin/auth', authRoutes);
    app.use('/api/admin/employees', employeeRoutes);
    app.use('/api/admin/ideas', ideaRoutes);
    app.use('/api/admin/reviewers', reviewerRoutes);
    app.use('/api/admin/users', usersRoutes);
    console.log('✅ API routes mounted');
  } else {
    // Mock routes for development without database
    app.get('/api/admin/auth/me', (req, res) => {
      res.json({
        user: {
          id: 'mock-user-id',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'admin'
        }
      });
    });
    
    app.post('/api/admin/auth/login', (req, res) => {
      console.log('Login request received:', req.body);
      const { employeeNumber, password } = req.body;
      // For demo, allow only EMP001 and password 1234
      if (employeeNumber === 'EMP001' && password === '1234') {
        console.log('Employee login successful');
        res.json({
          token: 'mock-jwt-token',
          user: {
            id: 'mock-employee-id',
            name: 'John Doe',
            employeeNumber: 'EMP001',
            role: 'employee'
          }
        });
      } else {
        console.log('Login failed - invalid credentials');
        res.status(401).json({ message: 'Invalid credentials' });
      }
    });

    // Mock other routes
    app.get('/api/admin/ideas', (req, res) => {
      res.json({
        ideas: [],
        total: 0,
        departments: [],
        statuses: ['under_review', 'ongoing', 'approved', 'implemented', 'rejected'],
        priorities: ['low', 'medium', 'high', 'urgent'],
        totalPages: 0,
        currentPage: 1
      });
    });

    app.get('/api/admin/employees', (req, res) => {
      res.json({
        employees: [],
        total: 0,
        departments: [],
        totalPages: 0,
        currentPage: 1
      });
    });

    console.log('⚠️  Mock routes mounted (no database connection)');
  }
};

// Initialize app
const initializeApp = async () => {
  isDbConnected = await connectToMongoDB();
  setupRoutes();
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend will be available at: http://localhost:5173`);
    console.log(`🔗 API will be available at: http://localhost:${PORT}/api`);
  });
};

initializeApp();