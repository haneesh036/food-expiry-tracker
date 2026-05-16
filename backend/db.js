const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Food_Items table
    db.run(`CREATE TABLE IF NOT EXISTS Food_Items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      barcode TEXT,
      product_name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      quantity INTEGER DEFAULT 1,
      expiry_date DATE,
      storage_location TEXT,
      product_image TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active', -- active, consumed, wasted
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id)
    )`);

    // Create Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS Notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      item_id INTEGER,
      message TEXT,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id),
      FOREIGN KEY (item_id) REFERENCES Food_Items(id)
    )`);
  }
});

module.exports = db;
