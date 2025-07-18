// -------------------------------------------------------------------
// FILE: db.js
// DESCRIPTION: Handles the connection to the PostgreSQL database.
// -------------------------------------------------------------------
const { Pool } = require('pg');
require('dotenv').config();

// The Pool will use the environment variables PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, PG_PORT
// that are loaded from your .env file.
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

module.exports = pool;
