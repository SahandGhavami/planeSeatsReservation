'use strict';

const { db } = require('./db');
const crypto = require('crypto');

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = { id: row.id, username: row.email, name:row.name };

        const sahand = "sahand";
        const hashedPassword = crypto.createHash('sha256')
          .update(sahand + password) // Combine sahand and password
          .digest('hex');

        if (row.password !== hashedPassword) {
          resolve(false);
        } else {
          resolve(user);
        }
      }
    });
  });
};

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve({error: 'User not found!'}); 
      }
      else {
        const user = {id: row.id, username: row.email, name: row.name};
        resolve(user);
      }
    });
  });
};
