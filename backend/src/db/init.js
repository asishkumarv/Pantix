import pool from "../config/db.js";

const schema = `
  CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100) REFERENCES categories(id) ON DELETE SET NULL,
    category_label VARCHAR(255),
    image TEXT,
    images TEXT[],
    sizes VARCHAR(50)[],
    description TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    stock INT,
    badge VARCHAR(100),
    colors JSONB,
    sku VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'Active',
    is_budget BOOLEAN DEFAULT FALSE,
    is_popular BOOLEAN DEFAULT FALSE
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    region VARCHAR(100),
    tier VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    addresses JSONB DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Ordered',
    payment VARCHAR(50) DEFAULT 'COD',
    items JSONB NOT NULL,
    address JSONB
  );

  CREATE TABLE IF NOT EXISTS order_status_dates (
    order_id VARCHAR(100) PRIMARY KEY,
    status_dates JSONB NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resellers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    region VARCHAR(255),
    sales NUMERIC(10, 2) DEFAULT 0.00,
    tier VARCHAR(50) DEFAULT 'Bronze',
    status VARCHAR(50) DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS review_user_emails (
    review_id INT PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

async function initDB() {
  try {
    console.log("Initializing database tables...");
    await pool.query(schema);
    console.log("Ensuring new columns exist...");
    try {
      await pool.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_budget BOOLEAN DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP WITH TIME ZONE;
      `);
    } catch (alterErr) {
      console.warn("Skipping ALTER columns migrations (likely permission restriction on owned tables):", alterErr.message || alterErr);
    }
    console.log("Database tables initialized successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error initializing database schema:", err);
    process.exit(1);
  }
}

initDB();
