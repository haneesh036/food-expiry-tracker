const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
// NOTE: For simplicity we are using plain text passwords in this prototype.
// In a real app, use bcrypt to hash passwords.

const JWT_SECRET = 'your_jwt_secret_key_here'; // Use environment variable in production

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.run('INSERT INTO Users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    const token = jwt.sign({ id: this.lastID, name, email }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ message: 'User registered successfully', token, user: { id: this.lastID, name, email } });
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM Users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

module.exports = router;
