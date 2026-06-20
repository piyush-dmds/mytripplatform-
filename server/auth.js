import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { db, hashPassword } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'platform_my_trip_secret_key_123_abc';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid session. Please login again.' });
    }
    req.user = decoded;
    next();
  });
}

export function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
}

export async function registerUser(req, res) {
  try {
    const { username, password, name, phone, address } = req.body;
    
    if (!username || !password || !name || !phone || !address) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const users = await db.getUsers();
    
    // Check if username already exists
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      username,
      password: hashPassword(password),
      name,
      phone,
      address,
      role: 'user', // Default registered users are customers
      createdAt: new Date().toISOString()
    };

    await db.saveUser(newUser);

    // Create token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
}

export async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const users = await db.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user || user.password !== hashPassword(password)) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

export async function getMe(req, res) {
  try {
    const users = await db.getUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
}

export async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required.' });
    }

    let uid, email, name;

    if (db.isFirebaseActive() && idToken !== 'mock-google-token') {
      // Verify token via Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      uid = decodedToken.uid;
      email = decodedToken.email;
      name = decodedToken.name;
    } else {
      // Local Fallback Mock Google Login (for testing without Firebase keys / frontend config)
      console.log(">>> Using local mock Google verification.");
      if (idToken === 'mock-google-token') {
        uid = 'usr-mockgoogle123';
        email = 'googleuser@example.com';
        name = 'Rohit Kumar (Google)';
      } else {
        return res.status(400).json({ error: 'Invalid mock ID token.' });
      }
    }

    const users = await db.getUsers();
    let user = users.find(u => u.id === uid || u.username.toLowerCase() === email.split('@')[0].toLowerCase());

    if (!user) {
      // Create new user in db
      user = {
        id: uid,
        username: email.split('@')[0],
        password: hashPassword(Math.random().toString(36)), // random dummy password
        name: name || 'Google Traveler',
        phone: '', // to be updated by customer
        address: '', // to be updated by customer
        role: 'user',
        createdAt: new Date().toISOString()
      };
      await db.saveUser(user);
    }

    // Sign Express Session JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google Sign-In successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(500).json({ error: 'Server error during Google Login verification.' });
  }
}
