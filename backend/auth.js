const crypto = require('node:crypto');
function createAuth() {
  const user = process.env.ADMIN_USER || 'administrador';
  const password = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.AUTH_SECRET || '';
  if (password.length < 12 || secret.length < 32) throw new Error('Configure ADMIN_PASSWORD (mínimo 12 caracteres) e AUTH_SECRET (mínimo 32) no ambiente ou em backend/.env. Consulte PUBLICACAO.md.');
  const salt = crypto.randomBytes(16);
  const passwordHash = crypto.scryptSync(password, salt, 64);
  const attempts = new Map();
  const sign = data => crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const equal = (a, b) => {
    const x = Buffer.from(a), y = Buffer.from(b);
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  };
  function login(req, res) {
    const now = Date.now();
    for (const [ip, value] of attempts) if (value.until <= now) attempts.delete(ip);
    const attempt = attempts.get(req.ip) || { count: 0, until: now + 60000 };
    if (attempt.count >= 10 || attempts.size > 10000) {
      res.set('Retry-After', '60');
      return res.status(429).json({ erro: 'Muitas tentativas. Tente novamente em um minuto.' });
    }
    attempt.count++;
    attempts.set(req.ip, attempt);
    const candidate = typeof req.body.senha === 'string' ? req.body.senha : '';
    const valid = candidate.length <= 200 && crypto.timingSafeEqual(crypto.scryptSync(candidate, salt, 64), passwordHash);
    if (!valid || req.body.usuario !== user) return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    const exp = Math.floor(now / 1000) + 8 * 3600;
    const payload = Buffer.from(JSON.stringify({ sub: user, exp })).toString('base64url');
    res.json({ token: `${payload}.${sign(payload)}`, usuario: user, expira_em: exp });
  }
  function requireAuth(req, res, next) {
    try {
      const [payload, signature, extra] = (req.get('Authorization') || '').replace(/^Bearer /, '').split('.');
      if (!payload || !signature || extra || !equal(sign(payload), signature)) throw new Error();
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (session.sub !== user || !Number.isFinite(session.exp) || session.exp <= Date.now() / 1000) throw new Error();
      req.user = session.sub;
      next();
    } catch (_) { res.status(401).json({ erro: 'Sessão expirada ou inválida. Entre novamente.' }); }
  }
  return { login, requireAuth };
}
module.exports = { createAuth };
