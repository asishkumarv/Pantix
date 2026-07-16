import pool from "../config/db.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, joined_at, status, is_reseller, reseller_status FROM users ORDER BY joined_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllUsers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, role } = req.body;

  try {
    const check = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const current = check.rows[0];

    const result = await pool.query(
      `UPDATE users SET
        status = $1,
        role = $2
      WHERE id = $3
      RETURNING id, name, email, phone, role, joined_at, status`,
      [
        status !== undefined ? status : current.status,
        role !== undefined ? role : current.role,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateUserStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  try {
    const check = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const current = check.rows[0];
    
    let passwordHash = current.password_hash;
    if (password && password.trim() !== "") {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const emailLower = email ? email.toLowerCase() : current.email;

    if (email && emailLower !== current.email) {
      const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [emailLower, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const result = await pool.query(
      `UPDATE users SET
        name = $1,
        email = $2,
        password_hash = $3,
        role = $4,
        status = $5
      WHERE id = $6
      RETURNING id, name, email, phone, role, joined_at, status`,
      [
        name !== undefined ? name : current.name,
        emailLower,
        passwordHash,
        role !== undefined ? role : current.role,
        status !== undefined ? status : current.status,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
