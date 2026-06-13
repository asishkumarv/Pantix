import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "pantix_jwt_secret_key_123_456_789";

export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    const emailLower = email.toLowerCase();
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [emailLower]
    );
    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role, status)
       VALUES ($1, $2, $3, $4, 'user', 'Active')
       RETURNING id, name, email, phone, role, status, joined_at`,
      [name, emailLower, passwordHash, phone || null]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    const emailLower = email.toLowerCase();
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [emailLower]
    );
    if (userCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'Active')
       RETURNING id, name, email, role, status, joined_at`,
      [name, emailLower, passwordHash]
    );

    res.status(201).json({ user: result.rows[0], message: "Admin created successfully" });
  } catch (err) {
    console.error("CreateAdmin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ error: "Your account is inactive" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Exclude password hash from response
    const { password_hash, ...userProfile } = user;
    res.json({ token, user: userProfile });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, status, joined_at, is_reseller, wallet_balance, addresses FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const enableResellerMode = async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE users SET is_reseller = TRUE WHERE id = $1 RETURNING id, name, email, phone, role, status, joined_at, is_reseller, wallet_balance",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("enableResellerMode error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  try {
    // Fetch current user with password hash
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, req.user.id]
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("ChangePassword error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addAddress = async (req, res) => {
  const { address } = req.body;
  if (!address || !address.id) return res.status(400).json({ error: "Address is required" });
  try {
    const result = await pool.query(
      `UPDATE users SET addresses = COALESCE(addresses, '[]'::jsonb) || $1::jsonb WHERE id = $2 RETURNING addresses`,
      [JSON.stringify([address]), req.user.id]
    );
    res.json({ success: true, addresses: result.rows[0].addresses });
  } catch (err) {
    console.error("AddAddress error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query("SELECT addresses FROM users WHERE id = $1", [req.user.id]);
    let addresses = userResult.rows[0]?.addresses || [];
    if (typeof addresses === 'string') addresses = JSON.parse(addresses);
    
    addresses = addresses.filter(a => a.id !== id);
    
    const updateResult = await pool.query(
      "UPDATE users SET addresses = $1::jsonb WHERE id = $2 RETURNING addresses",
      [JSON.stringify(addresses), req.user.id]
    );
    res.json({ success: true, addresses: updateResult.rows[0].addresses });
  } catch (err) {
    console.error("RemoveAddress error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
