import pool from "../config/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, role, joined_at, status FROM users ORDER BY joined_at DESC"
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
