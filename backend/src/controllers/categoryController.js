import pool from "../config/db.js";

export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllCategories error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createCategory = async (req, res) => {
  const { id, name, slug, image } = req.body;
  if (!id || !name || !slug) {
    return res.status(400).json({ error: "ID, name, and slug are required" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO categories (id, name, slug, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, slug, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CreateCategory error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Category with this ID already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, image } = req.body;

  try {
    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           image = COALESCE($3, image)
       WHERE id = $4
       RETURNING *`,
      [name, slug, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateCategory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("DeleteCategory error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
