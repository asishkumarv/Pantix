import pool from "../config/db.js";

export const createEnquiry = async (req, res) => {
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO enquiries (name, email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, subject, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating enquiry:", err);
    res.status(500).json({ error: "Failed to create enquiry" });
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM enquiries ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching enquiries:", err);
    res.status(500).json({ error: "Failed to fetch enquiries" });
  }
};
