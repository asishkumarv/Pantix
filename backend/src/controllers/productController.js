import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const getAllProducts = async (req, res) => {
  const { category, search, status } = req.query;

  try {
    let query = "SELECT * FROM products";
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR description ILIKE $${params.length} OR sku ILIKE $${params.length})`
      );
    }

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllProducts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GetProductById error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProduct = async (req, res) => {
  const {
    id,
    name,
    price,
    mrp,
    category,
    category_label,
    image,
    images,
    sizes,
    description,
    in_stock,
    stock,
    badge,
    colors,
    sku,
    status,
    is_budget,
    is_popular,
    commission_rate,
  } = req.body;

  if (!id || !name || price === undefined || mrp === undefined) {
    return res
      .status(400)
      .json({ error: "ID, name, price, and mrp are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (
        id, name, price, mrp, category, category_label, image, images, sizes,
        description, in_stock, stock, badge, colors, sku, status, is_budget, is_popular, commission_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        id,
        name,
        price,
        mrp,
        category || null,
        category_label || null,
        image || null,
        images || null,
        sizes || null,
        description || null,
        in_stock !== undefined ? in_stock : true,
        stock !== undefined ? stock : null,
        badge || null,
        colors ? JSON.stringify(colors) : null,
        sku || `SKU-${Date.now()}`,
        status || "Active",
        is_budget === true || is_budget === "true" || is_budget === 1,
        is_popular === true || is_popular === "true" || is_popular === 1,
        commission_rate !== undefined ? commission_rate : 0.00,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CreateProduct error:", err);
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "Product ID or SKU already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    mrp,
    category,
    category_label,
    image,
    images,
    sizes,
    description,
    in_stock,
    stock,
    badge,
    colors,
    sku,
    status,
    is_budget,
    is_popular,
    commission_rate,
  } = req.body;

  try {
    const check = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const current = check.rows[0];

    const result = await pool.query(
      `UPDATE products SET
        name = $1,
        price = $2,
        mrp = $3,
        category = $4,
        category_label = $5,
        image = $6,
        images = $7,
        sizes = $8,
        description = $9,
        in_stock = $10,
        stock = $11,
        badge = $12,
        colors = $13,
        sku = $14,
        status = $15,
        is_budget = $16,
        is_popular = $17,
        commission_rate = $18
      WHERE id = $19
      RETURNING *`,
      [
        name !== undefined ? name : current.name,
        price !== undefined ? price : current.price,
        mrp !== undefined ? mrp : current.mrp,
        category !== undefined ? (category || null) : current.category,
        category_label !== undefined ? (category_label || null) : current.category_label,
        image !== undefined ? (image || null) : current.image,
        images !== undefined ? images : current.images,
        sizes !== undefined ? sizes : current.sizes,
        description !== undefined ? description : current.description,
        in_stock !== undefined ? in_stock : current.in_stock,
        stock !== undefined ? stock : current.stock,
        badge !== undefined ? badge : current.badge,
        colors !== undefined ? JSON.stringify(colors) : (current.colors ? JSON.stringify(current.colors) : null),
        sku !== undefined ? sku : current.sku,
        status !== undefined ? status : current.status,
        is_budget !== undefined ? (is_budget === true || is_budget === "true" || is_budget === 1) : current.is_budget,
        is_popular !== undefined ? (is_popular === true || is_popular === "true" || is_popular === 1) : current.is_popular,
        commission_rate !== undefined ? commission_rate : current.commission_rate,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateProduct error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", id });
  } catch (err) {
    console.error("DeleteProduct error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*, rue.user_email 
       FROM reviews r 
       LEFT JOIN review_user_emails rue ON r.id = rue.review_id 
       WHERE r.product_id = $1 
       ORDER BY r.date DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GetProductReviews error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createProductReview = async (req, res) => {
  const { productId } = req.params;
  const { name, rating, text } = req.body;

  if (!name || !rating || !text) {
    return res.status(400).json({ error: "Name, rating, and text are required" });
  }

  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  // Optional authentication check to associate review with user email
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  let user = null;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || "pantix_jwt_secret_key_123_456_789");
    } catch (e) {
      // Treat invalid token as guest
    }
  }

  try {
    const checkProduct = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const result = await pool.query(
      `INSERT INTO reviews (product_id, name, rating, text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, name, ratingVal, text]
    );
    const newReview = result.rows[0];

    if (user && user.email) {
      await pool.query(
        "INSERT INTO review_user_emails (review_id, user_email) VALUES ($1, $2)",
        [newReview.id, user.email]
      );
      newReview.user_email = user.email;
    }

    res.status(201).json(newReview);
  } catch (err) {
    console.error("CreateProductReview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProductReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const user = req.user; // populated by authenticateToken middleware

  try {
    const reviewRes = await pool.query(
      `SELECT r.*, rue.user_email 
       FROM reviews r 
       LEFT JOIN review_user_emails rue ON r.id = rue.review_id 
       WHERE r.id = $1`,
      [reviewId]
    );

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = reviewRes.rows[0];
    const isAdmin = user.role === "admin" || user.role === "Super Admin" || user.role === "admin-user";
    const isOwner = review.user_email && review.user_email.toLowerCase() === user.email.toLowerCase();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "You are not authorized to delete this review" });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("DeleteProductReview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProductReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const { rating, text } = req.body;
  const user = req.user; // populated by authenticateToken middleware

  if (!rating || !text) {
    return res.status(400).json({ error: "Rating and text are required" });
  }

  const ratingVal = parseInt(rating, 10);
  if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const reviewRes = await pool.query(
      `SELECT r.*, rue.user_email 
       FROM reviews r 
       LEFT JOIN review_user_emails rue ON r.id = rue.review_id 
       WHERE r.id = $1`,
      [reviewId]
    );

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    const review = reviewRes.rows[0];
    const isOwner = review.user_email && review.user_email.toLowerCase() === user.email.toLowerCase();

    if (!isOwner) {
      return res.status(403).json({ error: "You are not authorized to edit this review" });
    }

    const result = await pool.query(
      `UPDATE reviews 
       SET rating = $1, text = $2 
       WHERE id = $3 
       RETURNING *`,
      [ratingVal, text, reviewId]
    );
    
    // Add user_email back to the returned object so frontend state maps it correctly
    const updatedReview = result.rows[0];
    updatedReview.user_email = review.user_email;

    res.json(updatedReview);
  } catch (err) {
    console.error("UpdateProductReview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
