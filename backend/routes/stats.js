const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const userId = req.user.id;

  // Simple stats for dashboard
  const today = new Date().toISOString().split('T')[0];
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  db.all('SELECT * FROM Food_Items WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });
    
    let totalItems = 0;
    let expiringSoon = 0;
    let expiredItems = 0;
    let wastedItems = 0;
    
    rows.forEach(item => {
      if (item.status === 'active') {
        totalItems++;
        if (item.expiry_date) {
          if (item.expiry_date < today) {
            expiredItems++;
          } else if (item.expiry_date <= threeDaysStr) {
            expiringSoon++;
          }
        }
      } else if (item.status === 'wasted') {
        wastedItems++;
      }
    });

    res.json({
      totalItems,
      expiringSoon,
      expiredItems,
      wastedItems,
      recentActivity: rows.slice(-5) // Basic recent activity
    });
  });
});

module.exports = router;
