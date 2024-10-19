import jwt from 'jsonwebtoken';

export function authenticateToken(handler) {
  return async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 'Bearer TOKEN'

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user info to the request
      return handler(req, res);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  };
}
