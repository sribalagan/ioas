const { Pool } = require("pg");

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "IOAS",
  password: "seemasri",
  port: 5432, // Default PostgreSQL port
});

module.exports = pool;
