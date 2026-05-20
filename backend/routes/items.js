const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get all items for a user
router.get('/', auth, (req, res) => {
  const userId = req.user.id;

  db.all('SELECT * FROM Food_Items WHERE user_id = ? ORDER BY expiry_date ASC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    res.json(rows);
  });
});

// Add new item
router.post('/', auth, (req, res) => {
  const { barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes } = req.body;
  const userId = req.user.id;
  
  db.run(
    `INSERT INTO Food_Items (user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      res.status(201).json({ message: 'Item added successfully', id: this.lastID });
    }
  );
});

// Delete item
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.run('DELETE FROM Food_Items WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Item not found or unauthorized' });
    res.json({ message: 'Item deleted successfully' });
  });
});

// Update item details
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const { product_name, brand, category, quantity, expiry_date, storage_location, notes } = req.body;
  const userId = req.user.id;
  
  db.run(
    `UPDATE Food_Items SET product_name = ?, brand = ?, category = ?, quantity = ?, expiry_date = ?, storage_location = ?, notes = ? WHERE id = ? AND user_id = ?`,
    [product_name, brand, category, quantity, expiry_date, storage_location, notes, id, userId],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Item not found or unauthorized' });
      res.json({ message: 'Item updated successfully' });
    }
  );
});

// Update item status
router.put('/:id/status', auth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  
  if (!['active', 'consumed', 'wasted'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  db.get('SELECT * FROM Food_Items WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    if (!row) return res.status(404).json({ message: 'Item not found or unauthorized' });
    
    if ((status === 'consumed' || status === 'wasted') && row.quantity > 1) {
      // Decrease quantity of current item
      db.run('UPDATE Food_Items SET quantity = quantity - 1 WHERE id = ? AND user_id = ?', [id, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        
        // Insert a new row for the consumed/wasted item with quantity 1
        db.run(
          `INSERT INTO Food_Items (user_id, barcode, product_name, brand, category, quantity, expiry_date, storage_location, notes, status)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
          [userId, row.barcode, row.product_name, row.brand, row.category, row.expiry_date, row.storage_location, row.notes, status],
          function(err) {
             if (err) console.error('Error inserting split item:', err.message);
          }
        );
        
        res.json({ message: '1 item ' + status + ', remaining quantity updated' });
      });
    } else {
      // If quantity is 1, just update the status
      db.run('UPDATE Food_Items SET status = ? WHERE id = ? AND user_id = ?', [status, id, userId], function(err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Item not found or unauthorized' });
        res.json({ message: 'Item status updated successfully' });
      });
    }
  });
});

module.exports = router;
