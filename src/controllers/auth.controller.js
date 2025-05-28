const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const signup = async (req, res) => {
  try {
    console.log('Signup attempt:', { 
      username: req.body.username,
      email: req.body.email,
      hasPassword: !!req.body.password 
    });

    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      console.log('Signup validation failed:', { 
        hasUsername: !!username, 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Password length validation
    if (password.length < 6) {
      console.log('Password too short:', password.length);
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection error'
      });
    }

    // Check for existing user
    console.log('Checking for existing user:', { email, username });
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', { 
        email: existingUser.email === email,
        username: existingUser.username === username 
      });
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Create nw user
    console.log('Creating new user:', { username, email });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });

    try {
      await user.save();
      console.log('User saved successfully:', { username, email });
    } catch (saveError) {
      console.error('Error saving user:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code,
        stack: saveError.stack
      });
      throw saveError;
    }

    // Generate token
    console.log('Generating token for new user:', { username, email });
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    console.log('Signup successful:', { username, email });
    res.status(201).json({ 
      success: true,
      token, 
      userId: user._id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Signup error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      message: 'Error creating user', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

const login = async (req, res) => {
  try {
    console.log('Login attempt:', { 
      email: req.body.email,
      hasPassword: !!req.body.password,
      headers: req.headers
    });
    
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      console.log('Login validation failed:', { 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection error'
      });
    }

    // Find user
    console.log('Searching for user with email:', email);
    let user;
    try {
      user = await User.findOne({ email });
      console.log('User search result:', user ? 'User found' : 'User not found');
    } catch (findError) {
      console.error('Error finding user:', {
        name: findError.name,
        message: findError.message,
        code: findError.code,
        stack: findError.stack
      });
      throw findError;
    }

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    console.log('Verifying password for user:', email);
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password verification result:', isValidPassword ? 'Valid' : 'Invalid');
    } catch (bcryptError) {
      console.error('Error comparing passwords:', {
        name: bcryptError.name,
        message: bcryptError.message,
        stack: bcryptError.stack
      });
      throw bcryptError;
    }

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    console.log('Generating token for user:', email);
    let token;
    try {
      token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Token generated successfully');
    } catch (jwtError) {
      console.error('Error generating token:', {
        name: jwtError.name,
        message: jwtError.message,
        stack: jwtError.stack
      });
      throw jwtError;
    }

    // Send response
    console.log('Login successful for user:', email);
    res.json({ 
      success: true,
      token, 
      userId: user._id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      message: 'Error logging in', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

const profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user profile', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  signup,
  login,
  profile
};