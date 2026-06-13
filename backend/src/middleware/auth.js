import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "pantix_jwt_secret_key_123_456_789",
    (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    }
  );
};

export const requireAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "Super Admin" ||
      req.user.role === "admin-user")
  ) {
    next();
  } else {
    res.status(403).json({ error: "Admin access required" });
  }
};
