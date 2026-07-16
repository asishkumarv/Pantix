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
  const { items, total, payment, address, reseller_code } = req.body;

  if (!items || !total) {
    return res.status(400).json({ error: "Items and total are required" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let reseller_id = null;
    if (reseller_code) {
      const resellerRes = await client.query("SELECT id FROM users WHERE reseller_code = $1 AND is_reseller = TRUE", [reseller_code]);
      if (resellerRes.rows.length > 0) {
        reseller_id = resellerRes.rows[0].id;
      }
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const id = `PNX-${randNum}`;

    let customer_name = req.user.name;
    const customer_email = req.user.email;

    if (!customer_name) {
      const userRes = await client.query("SELECT name FROM users WHERE email = $1", [customer_email]);
      if (userRes.rows.length > 0) {
        customer_name = userRes.rows[0].name;
      } else {
        customer_name = "Customer";
      }
    }

    const result = await client.query(
      `INSERT INTO orders (id, customer_name, customer_email, total, status, payment, items, address, reseller_id, reseller_commission)
       VALUES ($1, $2, $3, $4, 'Ordered', $5, $6, $7, $8, 0.00)
       RETURNING *`,
      [
        id,
        customer_name,
        customer_email,
        total,
        payment || "COD",
        JSON.stringify(items),
        address ? JSON.stringify(address) : null,
        reseller_id
      ]
    );

    // Decrement stock for each item based on color and size
    for (const item of items) {
      const prodRes = await client.query(
        "SELECT colors, stock FROM products WHERE id = $1 FOR UPDATE",
        [item.id]
      );
      if (prodRes.rows.length > 0) {
        const { colors, stock } = prodRes.rows[0];
        const qty = parseInt(item.qty || 1, 10);
        
        let colorsUpdated = false;
        let parsedColors = colors;
        if (typeof colors === "string") {
          try {
            parsedColors = JSON.parse(colors);
          } catch (e) {}
        }

        if (Array.isArray(parsedColors) && item.color && item.size) {
          const colorObj = parsedColors.find((c) => c.name === item.color);
          if (colorObj && Array.isArray(colorObj.sizes)) {
            const sizeObj = colorObj.sizes.find((s) => s.size === item.size);
            if (sizeObj) {
              if (sizeObj.stock < qty) {
                throw new Error(
                  `Insufficient stock for product ${item.name} (Color: ${item.color}, Size: ${item.size})`
                );
              }
              sizeObj.stock = Math.max(0, sizeObj.stock - qty);
              colorsUpdated = true;
            }
          }
        }

        let nextStock = stock;
        if (colorsUpdated) {
          // Total stock is the sum of all size stocks across all colors
          let totalStock = 0;
          parsedColors.forEach((c) => {
            if (Array.isArray(c.sizes)) {
              c.sizes.forEach((s) => {
                totalStock += parseInt(s.stock || 0, 10);
              });
            }
          });
          nextStock = totalStock;

          await client.query(
            "UPDATE products SET colors = $1, stock = $2, in_stock = $3 WHERE id = $4",
            [JSON.stringify(parsedColors), nextStock, nextStock > 0, item.id]
          );
        } else {
          // Fallback: decrement overall stock directly
          if (stock < qty) {
            throw new Error(`Insufficient stock for product ${item.name}`);
          }
          nextStock = Math.max(0, stock - qty);
          await client.query(
            "UPDATE products SET stock = $1, in_stock = $2 WHERE id = $3",
            [nextStock, nextStock > 0, item.id]
          );
        }
      }
    }

    if (reseller_id) {
      for (const item of items) {
        const prodRes = await client.query("SELECT commission_rate FROM products WHERE id = $1", [item.id]);
        if (prodRes.rows.length > 0) {
          const rate = parseFloat(prodRes.rows[0].commission_rate) || 0;
          if (rate > 0) {
            const amount = parseFloat(item.price) * parseInt(item.quantity || 1) * (rate / 100);
            if (amount > 0) {
              await client.query(
                `INSERT INTO order_commissions (order_id, reseller_id, product_id, product_name, quantity, commission_amount, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
                [id, reseller_id, item.id, item.name, item.quantity || 1, amount]
              );
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("CreateOrder error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const check = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
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

    const result = await client.query(query, params);

    // Handle commission state changes based on order status
    if (status === 'Delivered') {
      const commRes = await client.query("UPDATE order_commissions SET status = 'Approved' WHERE order_id = $1 AND status = 'Pending' RETURNING reseller_id, commission_amount", [id]);
      for (const row of commRes.rows) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2", [row.commission_amount, row.reseller_id]);
      }
    } else if (status === 'Cancelled') {
      await client.query("UPDATE order_commissions SET status = 'Rejected' WHERE order_id = $1 AND status = 'Pending'", [id]);
    } else if (status === 'Refunded') {
      const commRes = await client.query("UPDATE order_commissions SET status = 'Reversed' WHERE order_id = $1 AND status = 'Approved' RETURNING reseller_id, commission_amount", [id]);
      for (const row of commRes.rows) {
        await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [row.commission_amount, row.reseller_id]);
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("UpdateOrderStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
