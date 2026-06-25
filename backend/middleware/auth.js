export function requireAuth(req, res, next) {
  console.log('[auth] cookie header present:', !!req.headers.cookie);
  console.log('[auth] sessionID:', req.sessionID);
  console.log('[auth] session.userId:', req.session.userId);
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
