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

  db.get('SELECT * FROM Food_Items WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (!row) return res.status(404).json({ message: 'Item not found' });
    
    if ((status === 'consumed' || status === 'wasted') && row.quantity > 1) {
      // Decrease quantity of current item
      db.run('UPDATE Food_Items SET quantity = quantity - 1 WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        
        // Insert a new row for the consumed/wasted item with quantity 1
        db.run(
          `INSERT INTO Food_Items (user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes, status)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
          [row.user_id, row.barcode, row.product_name, row.brand, row.category, row.expiry_date, row.storage_location, row.notes, status],
          function(err) {
             if (err) console.error('Error inserting split item:', err.message);
          }
        );
        
        res.json({ message: '1 item ' + status + ', remaining quantity updated' });
      });
    } else {
      // If quantity is 1, just update the status
      db.run('UPDATE Food_Items SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.json({ message: 'Item status updated successfully' });
      });
    }
  });
});

module.exports = router;
