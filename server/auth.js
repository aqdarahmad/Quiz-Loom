import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev-only-secret-change-me";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

export const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "7d" });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.auth = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.auth.role !== "admin")
      return res.status(403).json({ message: "Admins only" });
    next();
  });
}
