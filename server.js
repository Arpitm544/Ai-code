require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Log environment variables (without sensitive data)
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  hasMongoURI: !!process.env.MONGODB_URI,
  hasJWTSecret: !!process.env.JWT_SECRET
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://ai-code-t1sb.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
});

// Welcome message route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Backend API is successfully deployed and running!',
    status: 'active'
  });
});

// Routes
app.use('/ai', require('./src/routes/ai.routes'));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/comments', require('./src/routes/comment.routes'));
app.use('/api/messages', require('./src/routes/message.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasMongoURI: !!process.env.MONGODB_URI,
      hasJWTSecret: !!process.env.JWT_SECRET
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  const status = err.status || 500;
  const message = err.message || 'Something went wrong!';
  
  res.status(status).json({ 
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      message: err.message,
      code: err.code
    } : undefined
  });
});

// Connect to MongoDB with improved error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    // Don't exit the process in production
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
  // Don't exit the process in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

// Export the Express app for Vercel
module.exports = app;