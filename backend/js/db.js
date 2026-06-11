const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '828306',
  database: 'blog',
  connectionLimit: 10
});

module.exports = pool;