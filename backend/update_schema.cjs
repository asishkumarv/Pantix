const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 2) DEFAULT 0.00;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reseller_code VARCHAR(50) UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reseller_status VARCHAR(50) DEFAULT 'None';

      
      CREATE TABLE IF NOT EXISTS order_commissions (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE,
        reseller_id INT REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(100),
        product_name VARCHAR(255),
        quantity INT,
        commission_amount NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reseller_clicks (
        id SERIAL PRIMARY KEY,
        reseller_id INT REFERENCES users(id) ON DELETE CASCADE,
        product_id VARCHAR(100),
        clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        mime_type VARCHAR(100) NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Database schema updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
