'use strict';

const sqlite = require('sqlite3');

// open the database
exports.db = new sqlite.Database('planeseat.sqlite', (err) => {
  if (err) throw err;
});