// middlewares/checkPassword.js
const REQUIRED_PASSWORD = process.env.PASSWORD || 'supersecret';

const checkPassword = (req, res, next) => {
  const password =
    req.query.password ||
    req.body?.password ||
    req.headers['x-password'];

  if (!password) {
    return res.status(401).json({ error: 'Password is required.' });
  }

  if (password !== REQUIRED_PASSWORD) {
    return res.status(403).json({ error: 'Invalid password.' });
  }

  next();
};

module.exports = checkPassword;
