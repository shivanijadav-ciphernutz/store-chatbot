// auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dbOps from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Hash password
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role: role || "user" },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// Signup function
export async function signup(name, email, password) {
  // Check if user already exists
  const existingUser = await dbOps.findDocuments('users', { email });
  if (existingUser.length > 0) {
    return {
      success: false,
      message: 'User with this email already exists'
    };
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const userDoc = {
    name,
    email,
    password: hashedPassword,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await dbOps.insertDocument('users', userDoc);
  
  return {
    success: true,
    message: 'User created successfully',
    userId: result.insertedId.toString(),
    user: {
      _id: result.insertedId.toString(),
      name,
      email,
      role: 'user'
    }
  };
}

// Login function
export async function login(email, password) {
  // Find user by email
  const users = await dbOps.findDocuments('users', { email });
  if (users.length === 0) {
    return {
      success: false,
      message: 'Invalid email or password'
    };
  }

  const user = users[0];

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return {
      success: false,
      message: 'Invalid email or password'
    };
  }

  // Generate token
  const token = generateToken(user._id.toString(), user.email, user.role);

  return {
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

// Get user by ID
export async function getUserById(userId) {
  const { ObjectId } = await import('mongodb');
  const users = await dbOps.findDocuments('users', { _id: new ObjectId(userId) });
  if (users.length === 0) {
    return null;
  }
  const user = users[0];
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}
