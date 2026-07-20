import pool from "../config/db.js";

export const getStats = async (req, res) => {
  try {
    // 1. Total Revenue (sum of all orders that are not cancelled)
    const revResult = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'Cancelled'"
    );
    const revenue = parseFloat(revResult.rows[0].total);

    // 2. Orders stats
    const orderResult = await pool.query(
      "SELECT COUNT(*) as count FROM orders"
    );
    const ordersCount = parseInt(orderResult.rows[0].count);

    // Status counts
    const statusCountsResult = await pool.query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );
    const statusCounts = {
      Ordered: 0,
      Shipped: 0,
      "Out for Delivery": 0,
      Delivered: 0,
      Cancelled: 0,
    };
    statusCountsResult.rows.forEach((row) => {
      let status = row.status;
      if (status === 'Pending') status = 'Ordered';
      else if (status === 'Processing') status = 'Shipped';
      
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += parseInt(row.count);
      } else {
        statusCounts[status] = parseInt(row.count);
      }
    });

    // 3. Users count
    const usersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    );
    const usersCount = parseInt(usersResult.rows[0].count);

    // 4. Resellers count — real users who activated reseller mode
    const resellersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE is_reseller = TRUE"
    );
    const resellersCount = parseInt(resellersResult.rows[0].count);

    // 5. Products stats
    const productsResult = await pool.query(
      "SELECT COUNT(*) as count FROM products"
    );
    const productsCount = parseInt(productsResult.rows[0].count);

    const lowStockResult = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE stock < 10 AND status = 'Active'"
    );
    const lowStockCount = parseInt(lowStockResult.rows[0].count);

    res.json({
      revenue,
      orders: ordersCount,
      pending: statusCounts.Ordered,
      ordered: statusCounts.Ordered,
      delivered: statusCounts.Delivered,
      shipped: statusCounts.Shipped + (statusCounts["Out for Delivery"] || 0),
      users: usersCount,
      resellers: resellersCount,
      products: productsCount,
      lowStock: lowStockCount,
      statusCounts,
    });
  } catch (err) {
    console.error("GetStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { range = "7d" } = req.query;
    let interval = "7 days";
    let dateFormat = "Dy";
    
    if (range.toLowerCase() === "1m") {
      interval = "30 days";
      dateFormat = "DD-Mon";
    } else if (range.toLowerCase() === "3m") {
      interval = "90 days";
      dateFormat = "DD-Mon";
    }

    const reportResult = await pool.query(`
      SELECT 
        TO_CHAR(series_date, $1) as day,
        COALESCE(SUM(o.total), 0) as revenue,
        COALESCE(COUNT(o.id), 0) as orders
      FROM (
        SELECT generate_series(
          DATE_TRUNC('day', NOW() - CAST($2 AS INTERVAL) + INTERVAL '1 day'),
          DATE_TRUNC('day', NOW()),
          INTERVAL '1 day'
        )::date as series_date
      ) s
      LEFT JOIN orders o ON DATE_TRUNC('day', o.date) = s.series_date AND o.status != 'Cancelled'
      GROUP BY series_date, TO_CHAR(series_date, $1)
      ORDER BY series_date ASC
    `, [dateFormat, interval]);

    const fallback = [
      { day: "Mon", revenue: 120, orders: 2 },
      { day: "Tue", revenue: 210, orders: 4 },
      { day: "Wed", revenue: 180, orders: 3 },
      { day: "Thu", revenue: 290, orders: 5 },
      { day: "Fri", revenue: 240, orders: 4 },
      { day: "Sat", revenue: 340, orders: 6 },
      { day: "Sun", revenue: 385, orders: 7 },
    ];

    if (reportResult.rows.length === 0) {
      return res.json(fallback);
    }

    res.json(
      reportResult.rows.map((r) => ({
        day: r.day,
        revenue: parseFloat(r.revenue),
        orders: parseInt(r.orders),
      }))
    );
  } catch (err) {
    console.error("GetRevenueReport error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    // 1. Fetch recent orders
    const ordersRes = await pool.query(
      "SELECT id, total, date FROM orders ORDER BY date DESC LIMIT 5"
    );
    const orderNotifications = ordersRes.rows.map((row) => ({
      id: `order-${row.id}`,
      type: "order",
      title: "New order received",
      description: `Order ${row.id} · ₹${parseInt(row.total, 10)}`,
      time: row.date,
    }));

    // 2. Fetch recent signups
    const signupsRes = await pool.query(
      "SELECT id, name, joined_at FROM users WHERE role = 'user' ORDER BY joined_at DESC LIMIT 5"
    );
    const signupNotifications = signupsRes.rows.map((row) => ({
      id: `signup-${row.id}`,
      type: "signup",
      title: "User signed up",
      description: `${row.name} joined`,
      time: row.joined_at,
    }));

    // 3. Fetch recent reseller upgrades/requests
    const resellersRes = await pool.query(
      `SELECT id, name, is_reseller, reseller_status, joined_at 
       FROM users 
       WHERE is_reseller = TRUE OR reseller_status = 'Pending' 
       ORDER BY joined_at DESC LIMIT 5`
    );
    const resellerNotifications = resellersRes.rows.map((row) => {
      const isPending = row.reseller_status === "Pending";
      return {
        id: `reseller-${row.id}`,
        type: "reseller",
        title: isPending ? "Reseller requested" : "Reseller upgraded",
        description: isPending 
          ? `${row.name} requested reseller access`
          : `${row.name} is active reseller`,
        time: row.joined_at,
      };
    });

    // 4. Combine and sort
    const allNotifications = [
      ...orderNotifications,
      ...signupNotifications,
      ...resellerNotifications,
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Take top 10
    res.json(allNotifications.slice(0, 10));
  } catch (err) {
    console.error("GetNotifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
