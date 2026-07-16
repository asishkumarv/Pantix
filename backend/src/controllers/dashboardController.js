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
    // Return aggregated revenue by day for the chart
    const reportResult = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Dy') as day,
        SUM(total) as revenue,
        COUNT(*) as orders
      FROM orders
      WHERE date >= NOW() - INTERVAL '7 days' AND status != 'Cancelled'
      GROUP BY TO_CHAR(date, 'Dy'), DATE_TRUNC('day', date)
      ORDER BY DATE_TRUNC('day', date) ASC
    `);

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
