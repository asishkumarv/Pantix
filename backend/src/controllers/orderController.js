import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const getAllOrders = async (req, res) => {
  try {
    let query = "SELECT * FROM orders";
    const params = [];

    // If user is not admin, only return their own orders
    if (
      req.user.role !== "admin" &&
      req.user.role !== "Super Admin" &&
      req.user.role !== "admin-user"
    ) {
      query += " WHERE customer_email = $1";
      params.push(req.user.email);
    }

    query += " ORDER BY date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllOrders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = result.rows[0];

    // Try to authenticate optional token
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let user = null;

    if (token) {
      try {
        user = jwt.verify(
          token,
          process.env.JWT_SECRET || "pantix_jwt_secret_key_123_456_789"
        );
      } catch (err) {
        // Ignore invalid token, treat as guest
      }
    }

    // Authorize: Admin or the customer themselves
    if (
      user &&
      (user.role === "admin" ||
        user.role === "Super Admin" ||
        user.role === "admin-user" ||
        order.customer_email === user.email)
    ) {
      return res.json(order);
    }

    // Otherwise return tracking summary
    res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      date: order.date,
    });
  } catch (err) {
    console.error("GetOrderById error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createOrder = async (req, res) => {
  const { items, total, payment, address, reseller_id, reseller_commission } = req.body;

  if (!items || !total) {
    return res.status(400).json({ error: "Items and total are required" });
  }

  // Generate a random order ID (e.g. PNX-1043)
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const id = `PNX-${randNum}`;

  try {
    let customer_name = req.user.name;
    const customer_email = req.user.email;

    if (!customer_name) {
      const userRes = await pool.query("SELECT name FROM users WHERE email = $1", [customer_email]);
      if (userRes.rows.length > 0) {
        customer_name = userRes.rows[0].name;
      } else {
        customer_name = "Customer";
      }
    }

    const result = await pool.query(
      `INSERT INTO orders (id, customer_name, customer_email, total, status, payment, items, address, reseller_id, reseller_commission)
       VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        customer_name,
        customer_email,
        total,
        payment || "COD",
        JSON.stringify(items),
        address ? JSON.stringify(address) : null,
        reseller_id || null,
        reseller_commission || 0.00
      ]
    );

    // Credit reseller commission instantly to their wallet balance
    if (reseller_id && Number(reseller_commission) > 0) {
      await pool.query(
        "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
        [Number(reseller_commission), reseller_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("CreateOrder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const check = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    let query = "UPDATE orders SET status = $1";
    const params = [status];

    if (payment) {
      params.push(payment);
      query += `, payment = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateOrderStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
