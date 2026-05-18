const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to verify JWT could go here, omitting for simplicity in prototype
// Assuming user ID is sent in headers or body for now.

// Get all items for a user
router.get('/', (req, res) => {
  const userId = req.query.user_id; // In production, get from JWT
  if (!userId) return res.status(400).json({ message: 'user_id is required' });

  db.all('SELECT * FROM Food_Items WHERE user_id = ? ORDER BY expiry_date ASC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(rows);
  });
});

// Add new item
router.post('/', (req, res) => {
  const { user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes } = req.body;
  
  db.run(
    `INSERT INTO Food_Items (user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      res.status(201).json({ message: 'Item added successfully', id: this.lastID });
    }
  );
});

// Delete item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Food_Items WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json({ message: 'Item deleted successfully' });
  });
});

// Update item details
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { product_name, brand, category, quantity, expiry_date, storage_location, notes } = req.body;
  
  db.run(
    `UPDATE Food_Items SET product_name = ?, brand = ?, category = ?, quantity = ?, expiry_date = ?, storage_location = ?, notes = ? WHERE id = ?`,
    [product_name, brand, category, quantity, expiry_date, storage_location, notes, id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      res.json({ message: 'Item updated successfully' });
    }
  );
});

// Update item status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['active', 'consumed', 'wasted'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.run('UPDATE Food_Items SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json({ message: 'Item status updated successfully' });
  });
});

module.exports = router;
