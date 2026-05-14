const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password' });

    // Fetch role-specific id
    let roleId = null;
    if (user.user_type === 'MEMBER') {
      const [m] = await pool.query('SELECT member_id FROM members WHERE user_id = ?', [user.user_id]);
      roleId = m.length ? m[0].member_id : null;
    } else if (user.user_type === 'TRAINER') {
      const [t] = await pool.query('SELECT trainer_id FROM trainers WHERE user_id = ?', [user.user_id]);
      roleId = t.length ? t[0].trainer_id : null;
    }

    const payload = {
      user_id:    user.user_id,
      user_type:  user.user_type,
      first_name: user.first_name,
      last_name:  user.last_name,
      email:      user.email,
      role_id:    roleId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register (Admin only in production; open for setup)
router.post('/register', async (req, res) => {
  const { user_type, first_name, last_name, email, phone, dob, password, fitness_goal, specialization, certification, years_of_exp } = req.body;
  if (!email || !password || !first_name || !last_name || !user_type)
    return res.status(400).json({ error: 'Required fields missing' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (user_type, first_name, last_name, email, phone, dob, password_hash) VALUES (?,?,?,?,?,?,?)',
      [user_type, first_name, last_name, email, phone || null, dob || null, hash]
    );
    const userId = result.insertId;

    if (user_type === 'MEMBER') {
      await pool.query('INSERT INTO members (user_id, fitness_goal) VALUES (?,?)', [userId, fitness_goal || null]);
    } else if (user_type === 'TRAINER') {
      await pool.query(
        'INSERT INTO trainers (user_id, specialization, certification, years_of_exp) VALUES (?,?,?,?)',
        [userId, specialization || null, certification || null, years_of_exp || null]
      );
    }
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
