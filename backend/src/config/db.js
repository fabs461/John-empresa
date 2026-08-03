const mysql = require('mysql2/promise');
require('dotenv').config();
console.log({
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? "CARGADA" : "NO CARGADA",
  DB_NAME: process.env.DB_NAME
});

// Creamos un pool de conexiones para reutilizar recursos eficientemente
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'john_empresa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;