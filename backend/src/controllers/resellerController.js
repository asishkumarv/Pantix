import pool from "../config/db.js";

export const getAllResellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email as contact,
        COALESCE(phone, 'India') as region,
        COALESCE((SELECT SUM(total) FROM orders WHERE reseller_id = users.id), 0.00) as sales,
        CASE 
          WHEN COALESCE((SELECT SUM(total) FROM orders WHERE reseller_id = users.id), 0.00) >= 50000 THEN 'Platinum'
          WHEN COALESCE((SELECT SUM(total) FROM orders WHERE reseller_id = users.id), 0.00) >= 20000 THEN 'Gold'
          WHEN COALESCE((SELECT SUM(total) FROM orders WHERE reseller_id = users.id), 0.00) >= 5000 THEN 'Silver'
          ELSE 'Bronze'
        END as tier,
        COALESCE(reseller_status, 'Active') as status
      FROM users
      WHERE is_reseller = TRUE OR reseller_status = 'Pending'
      ORDER BY 
        CASE WHEN reseller_status = 'Pending' THEN 0 ELSE 1 END,
        sales DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllResellers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createReseller = async (req, res) => {
  const { name, contact, region } = req.body;

  if (!name || !contact) {
    return res.status(400).json({ error: "Name and contact email are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, status, is_reseller, wallet_balance)
       VALUES ($1, $2, $3, '$2b$10$SeedHashedPasswordPlaceholderString123', 'customer', 'Active', TRUE, 0.00)
       ON CONFLICT (email) DO UPDATE SET is_reseller = TRUE
       RETURNING id, name, email as contact, phone as region`,
      [name, contact.toLowerCase(), region || null]
    );
    
    res.status(201).json({
      ...result.rows[0],
      sales: 0.00,
      tier: "Bronze",
      status: "Active"
    });
  } catch (err) {
    console.error("CreateReseller error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateReseller = async (req, res) => {
  const { id } = req.params;
  const { name, contact, region, status, tier } = req.body;

  try {
    const check = await pool.query("SELECT * FROM users WHERE id = $1 AND (is_reseller = TRUE OR reseller_status = 'Pending')", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Reseller not found" });
    }

    const current = check.rows[0];
    const newName = name !== undefined ? name : current.name;
    const newEmail = contact !== undefined ? contact : current.email;
    const newPhone = region !== undefined ? region : current.phone;
    const newStatus = status || current.reseller_status || 'Active';
    const newIsReseller = (newStatus === 'Active' || newStatus === 'Approved');

    const result = await pool.query(
      `UPDATE users SET
        name = $1,
        email = $2,
        phone = $3,
        reseller_status = $4,
        is_reseller = $5,
        reseller_code = CASE WHEN $5 = TRUE THEN COALESCE(reseller_code, 'RS' || id) ELSE reseller_code END
      WHERE id = $6
      RETURNING id, name, email as contact, phone as region, reseller_status as status`,
      [newName, newEmail, newPhone, newStatus, newIsReseller, id]
    );

    res.json({
      ...result.rows[0],
      sales: 0,
      tier: tier || "Bronze",
      status: status || "Active"
    });
  } catch (err) {
    console.error("UpdateReseller error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateResellerStatus = async (req, res) => {
  const { id } = req.params;
  const { status, tier, sales } = req.body;

  try {
    const result = await pool.query(
      `UPDATE resellers SET
        status = COALESCE($1, status),
        tier = COALESCE($2, tier),
        sales = COALESCE($3, sales)
      WHERE id = $4
      RETURNING *`,
      [
        status,
        tier,
        sales,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reseller not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UpdateResellerStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteReseller = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE users SET is_reseller = FALSE WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reseller not found" });
    }

    res.json({ message: "Reseller deleted", id: result.rows[0].id });
  } catch (err) {
    console.error("DeleteReseller error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requestWithdrawal = async (req, res) => {
  const { name, phone, account_number, ifsc_code, amount } = req.body;
  const userId = req.user.id;

  if (!name || !phone || !account_number || !ifsc_code || !amount) {
    return res.status(400).json({ error: "All bank details and amount are required" });
  }

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get current wallet balance
    const userRes = await client.query("SELECT wallet_balance FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = Number(userRes.rows[0].wallet_balance || 0);
    if (currentBalance < withdrawAmount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    // Deduct from wallet balance
    await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [withdrawAmount, userId]);

    // Insert withdrawal request
    const insertRes = await client.query(
      `INSERT INTO withdrawal_requests (user_id, name, phone, account_number, ifsc_code, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [userId, name, phone, account_number, ifsc_code, withdrawAmount]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, request: insertRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RequestWithdrawal error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyWithdrawals = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GetMyWithdrawals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.email as user_email, u.name as user_name
       FROM withdrawal_requests w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GetAllWithdrawals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateWithdrawalStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (status !== "Approved" && status !== "Rejected") {
    return res.status(400).json({ error: "Invalid status. Must be 'Approved' or 'Rejected'" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the request
    const requestRes = await client.query("SELECT * FROM withdrawal_requests WHERE id = $1", [id]);
    if (requestRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    const request = requestRes.rows[0];
    if (request.status !== "Pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Withdrawal request already processed" });
    }

    if (status === "Rejected") {
      // Refund the amount back to user's wallet balance
      await client.query(
        "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
        [Number(request.amount), request.user_id]
      );
    }

    // Update status
    const updateRes = await client.query(
      "UPDATE withdrawal_requests SET status = $1, processed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, id]
    );

    await client.query("COMMIT");
    res.json({ success: true, request: updateRes.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("UpdateWithdrawalStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyReferrals = async (req, res) => {
  const userId = req.user.id;
  const { filter, startDate, endDate } = req.query; // 'today', 'yesterday', '7days', '30days', 'all', 'custom'
  try {
    let dateFilter = "";
    const params = [userId];

    if (filter === "today") {
      dateFilter = "AND oc.created_at >= date_trunc('day', NOW())";
    } else if (filter === "yesterday") {
      dateFilter = "AND oc.created_at >= date_trunc('day', NOW() - interval '1 day') AND oc.created_at < date_trunc('day', NOW())";
    } else if (filter === "7days") {
      dateFilter = "AND oc.created_at >= NOW() - interval '7 days'";
    } else if (filter === "30days") {
      dateFilter = "AND oc.created_at >= NOW() - interval '30 days'";
    } else if (filter === "custom" && startDate && endDate) {
      dateFilter = "AND oc.created_at >= $2 AND oc.created_at <= $3";
      params.push(startDate, endDate);
    }

    const result = await pool.query(
      `SELECT oc.id, oc.order_id, oc.product_name, oc.commission_amount, oc.status, oc.created_at as date, o.total as order_amount
       FROM order_commissions oc
       JOIN orders o ON oc.order_id = o.id
       WHERE oc.reseller_id = $1 ${dateFilter} 
       ORDER BY oc.created_at DESC`,
      params
    );
    console.log("getMyReferrals result:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("GetMyReferrals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getMyStats = async (req, res) => {
  const userId = req.user.id;
  try {
    // Total lifetime earnings from referrals
    const totalRes = await pool.query(
      `SELECT 
         COALESCE(SUM(commission_amount), 0) AS total_earnings,
         COUNT(DISTINCT order_id) AS total_referrals
       FROM order_commissions 
       WHERE reseller_id = $1 AND status = 'Approved'`,
      [userId]
    );

    // Earnings & referrals this month
    const monthRes = await pool.query(
      `SELECT 
         COALESCE(SUM(commission_amount), 0) AS monthly_earnings,
         COUNT(DISTINCT order_id) AS monthly_referrals
       FROM order_commissions 
       WHERE reseller_id = $1
         AND status = 'Approved'
         AND created_at >= date_trunc('month', NOW())`,
      [userId]
    );

    // Total clicks
    const clicksRes = await pool.query(
      `SELECT COUNT(*) as total_clicks FROM reseller_clicks WHERE reseller_id = $1`,
      [userId]
    );

    const totalEarnings = parseFloat(totalRes.rows[0].total_earnings);
    const totalReferrals = parseInt(totalRes.rows[0].total_referrals);
    const monthlyEarnings = parseFloat(monthRes.rows[0].monthly_earnings);
    const monthlyReferrals = parseInt(monthRes.rows[0].monthly_referrals);

    // Tier based on total lifetime earnings
    let tier = "Bronze";
    let nextTier = "Silver";
    let nextTierThreshold = 200;
    let progress = Math.min((totalEarnings / 200) * 100, 100);

    if (totalEarnings >= 1000) {
      tier = "Platinum";
      nextTier = null;
      nextTierThreshold = null;
      progress = 100;
    } else if (totalEarnings >= 500) {
      tier = "Gold";
      nextTier = "Platinum";
      nextTierThreshold = 1000;
      progress = Math.min(((totalEarnings - 500) / 500) * 100, 100);
    } else if (totalEarnings >= 200) {
      tier = "Silver";
      nextTier = "Gold";
      nextTierThreshold = 500;
      progress = Math.min(((totalEarnings - 200) / 300) * 100, 100);
    }

    res.json({
      tier,
      nextTier,
      nextTierThreshold,
      progress: Math.round(progress),
      totalEarnings,
      totalReferrals,
      monthlyEarnings,
      monthlyReferrals,
      totalClicks: parseInt(clicksRes.rows[0].total_clicks) || 0,
    });
  } catch (err) {
    console.error("GetMyStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const trackClick = async (req, res) => {
  const { reseller_code, product_id } = req.body;
  if (!reseller_code || !product_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const userRes = await pool.query("SELECT id FROM users WHERE reseller_code = $1", [reseller_code]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Reseller not found" });
    }
    
    const reseller_id = userRes.rows[0].id;
    await pool.query(
      "INSERT INTO reseller_clicks (reseller_id, product_id) VALUES ($1, $2)",
      [reseller_id, product_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("TrackClick error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
