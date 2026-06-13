import dotenv from "dotenv";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dotenv is loaded relative to this file's position
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Prevent unhandled errors from crashing the Node.js server
pool.on("error", (err) => {
  console.error("Unexpected error on idle pg pool client:", err.message || err);
});

// Run database schema migrations
(async () => {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_reseller BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS reseller_id INT REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS reseller_commission NUMERIC(10, 2) DEFAULT 0.00;

      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        ifsc_code VARCHAR(50) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );
    `);
    console.log("Database migrations successfully executed!");
  } catch (err) {
    console.error("Database migration error:", err.message || err);
  }
})();

export default pool;
