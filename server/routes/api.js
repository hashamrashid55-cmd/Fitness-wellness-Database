const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../db');
const auth   = require('../middleware/auth');

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
router.get('/admin/users', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_all_users');
  res.json(rows);
});

router.get('/admin/members', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_members');
  res.json(rows);
});

router.get('/admin/trainers', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_trainers');
  res.json(rows);
});

router.get('/admin/subscriptions', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_subscriptions');
  res.json(rows);
});

router.get('/admin/devices', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_devices');
  res.json(rows);
});

router.get('/admin/revenue', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_admin_revenue');
  res.json(rows);
});

// Admin: stats summary
router.get('/admin/stats', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [[{ total_members }]]      = await pool.query('SELECT COUNT(*) AS total_members FROM members');
  const [[{ total_trainers }]]     = await pool.query('SELECT COUNT(*) AS total_trainers FROM trainers');
  const [[{ active_subs }]]        = await pool.query("SELECT COUNT(*) AS active_subs FROM subscriptions WHERE status='ACTIVE'");
  const [[{ total_revenue }]]      = await pool.query("SELECT IFNULL(SUM(price),0) AS total_revenue FROM subscriptions WHERE status='ACTIVE'");
  const [[{ total_sessions }]]     = await pool.query('SELECT COUNT(*) AS total_sessions FROM sessions');
  res.json({ total_members, total_trainers, active_subs, total_revenue, total_sessions });
});

// Admin: delete user
router.delete('/admin/users/:id', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
  res.json({ message: 'User deleted' });
});

// Admin: update user (non-password fields)
router.patch('/admin/users/:id', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { first_name, last_name, email, phone, dob } = req.body;
  try {
    await pool.query(
      'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone = ?, dob = ? WHERE user_id = ?',
      [first_name || null, last_name || null, email || null, phone ?? null, dob ?? null, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create member (user + members row)
router.post('/admin/members', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { first_name, last_name, email, phone, dob, password, fitness_goal } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: 'first_name, last_name, email, and password are required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (user_type, first_name, last_name, email, phone, dob, password_hash) VALUES (?,?,?,?,?,?,?)',
      ['MEMBER', first_name, last_name, email, phone || null, dob || null, hash]
    );
    const userId = result.insertId;
    await pool.query('INSERT INTO members (user_id, fitness_goal) VALUES (?,?)', [userId, fitness_goal || null]);
    res.status(201).json({ message: 'Member created', user_id: userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update member + linked user
router.patch('/admin/members/:memberId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { first_name, last_name, email, phone, dob, fitness_goal } = req.body;
  try {
    const [[m]] = await pool.query('SELECT user_id FROM members WHERE member_id = ?', [req.params.memberId]);
    if (!m) return res.status(404).json({ error: 'Member not found' });
    if (fitness_goal !== undefined)
      await pool.query('UPDATE members SET fitness_goal = ? WHERE member_id = ?', [fitness_goal, req.params.memberId]);
    if (first_name != null || last_name != null || email != null || phone !== undefined || dob !== undefined) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone = ?, dob = ? WHERE user_id = ?',
        [first_name || null, last_name || null, email || null, phone ?? null, dob ?? null, m.user_id]
      );
    }
    res.json({ message: 'Member updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: delete member (removes user and cascades)
router.delete('/admin/members/:memberId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [[m]] = await pool.query('SELECT user_id FROM members WHERE member_id = ?', [req.params.memberId]);
  if (!m) return res.status(404).json({ error: 'Member not found' });
  await pool.query('DELETE FROM users WHERE user_id = ?', [m.user_id]);
  res.json({ message: 'Member deleted' });
});

// Admin: create trainer
router.post('/admin/trainers', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { first_name, last_name, email, phone, dob, password, specialization, certification, years_of_exp, bio } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ error: 'first_name, last_name, email, and password are required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (user_type, first_name, last_name, email, phone, dob, password_hash) VALUES (?,?,?,?,?,?,?)',
      ['TRAINER', first_name, last_name, email, phone || null, dob || null, hash]
    );
    const userId = result.insertId;
    await pool.query(
      'INSERT INTO trainers (user_id, specialization, certification, years_of_exp, bio) VALUES (?,?,?,?,?)',
      [userId, specialization || null, certification || null, years_of_exp || null, bio || null]
    );
    res.status(201).json({ message: 'Trainer created', user_id: userId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: update trainer + linked user
router.patch('/admin/trainers/:trainerId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { first_name, last_name, email, phone, dob, specialization, certification, years_of_exp, bio, rating } = req.body;
  try {
    const [[t]] = await pool.query('SELECT user_id FROM trainers WHERE trainer_id = ?', [req.params.trainerId]);
    if (!t) return res.status(404).json({ error: 'Trainer not found' });
    if (specialization !== undefined || certification !== undefined || years_of_exp !== undefined || bio !== undefined || rating !== undefined) {
      await pool.query(
        'UPDATE trainers SET specialization = COALESCE(?, specialization), certification = COALESCE(?, certification), years_of_exp = COALESCE(?, years_of_exp), bio = COALESCE(?, bio), rating = COALESCE(?, rating) WHERE trainer_id = ?',
        [specialization ?? null, certification ?? null, years_of_exp ?? null, bio ?? null, rating ?? null, req.params.trainerId]
      );
    }
    if (first_name != null || last_name != null || email != null || phone !== undefined || dob !== undefined) {
      await pool.query(
        'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), email = COALESCE(?, email), phone = ?, dob = ? WHERE user_id = ?',
        [first_name || null, last_name || null, email || null, phone ?? null, dob ?? null, t.user_id]
      );
    }
    res.json({ message: 'Trainer updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admin/trainers/:trainerId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [[t]] = await pool.query('SELECT user_id FROM trainers WHERE trainer_id = ?', [req.params.trainerId]);
  if (!t) return res.status(404).json({ error: 'Trainer not found' });
  await pool.query('DELETE FROM users WHERE user_id = ?', [t.user_id]);
  res.json({ message: 'Trainer deleted' });
});

// Admin: create subscription
router.post('/admin/subscriptions', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { member_id, plan_type, start_date, end_date, price, payment_method, status } = req.body;
  if (!member_id || !plan_type || !start_date || price == null)
    return res.status(400).json({ error: 'member_id, plan_type, start_date, and price are required' });
  try {
    await pool.query(
      'INSERT INTO subscriptions (member_id, plan_type, start_date, end_date, price, payment_method, status) VALUES (?,?,?,?,?,?,?)',
      [member_id, plan_type, start_date, end_date || null, price, payment_method || null, status || 'ACTIVE']
    );
    res.status(201).json({ message: 'Subscription created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/admin/subscriptions/:subId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { plan_type, start_date, end_date, price, payment_method, status } = req.body;
  try {
    const [[s]] = await pool.query('SELECT sub_id FROM subscriptions WHERE sub_id = ?', [req.params.subId]);
    if (!s) return res.status(404).json({ error: 'Subscription not found' });
    await pool.query(
      'UPDATE subscriptions SET plan_type = COALESCE(?, plan_type), start_date = COALESCE(?, start_date), end_date = ?, price = COALESCE(?, price), payment_method = ?, status = COALESCE(?, status) WHERE sub_id = ?',
      [plan_type || null, start_date || null, end_date ?? null, price ?? null, payment_method ?? null, status || null, req.params.subId]
    );
    res.json({ message: 'Subscription updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admin/subscriptions/:subId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    const [[s]] = await pool.query('SELECT status FROM subscriptions WHERE sub_id = ?', [req.params.subId]);
    if (!s) return res.status(404).json({ error: 'Subscription not found' });
    if (s.status === 'ACTIVE')
      return res.status(400).json({ error: 'Set status to CANCELLED or INACTIVE before deleting an active subscription.' });
    await pool.query('DELETE FROM subscriptions WHERE sub_id = ?', [req.params.subId]);
    res.json({ message: 'Subscription deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: create device (+ wearable or mobile detail)
router.post('/admin/devices', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { member_id, device_name, manufacturer, category, battery_life, sensor_type, os } = req.body;
  if (!member_id || !device_name || !category)
    return res.status(400).json({ error: 'member_id, device_name, and category are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      'INSERT INTO devices (member_id, device_name, manufacturer, category) VALUES (?,?,?,?)',
      [member_id, device_name, manufacturer || null, category]
    );
    const deviceId = ins.insertId;
    if (category === 'WEARABLE') {
      await conn.query('INSERT INTO wearables (device_id, battery_life, sensor_type) VALUES (?,?,?)', [deviceId, battery_life || null, sensor_type || null]);
    } else if (category === 'MOBILE') {
      await conn.query('INSERT INTO mobiles (device_id, os) VALUES (?,?)', [deviceId, os || null]);
    } else {
      await conn.rollback();
      return res.status(400).json({ error: 'category must be WEARABLE or MOBILE' });
    }
    await conn.commit();
    res.status(201).json({ message: 'Device created', device_id: deviceId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.code === 'ER_DUP_ENTRY' ? 'Device name already exists for this member' : 'Server error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/devices/:deviceId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { device_name, manufacturer, battery_life, sensor_type, os } = req.body;
  try {
    const [[d]] = await pool.query('SELECT device_id, category FROM devices WHERE device_id = ?', [req.params.deviceId]);
    if (!d) return res.status(404).json({ error: 'Device not found' });
    if (device_name != null || manufacturer !== undefined)
      await pool.query(
        'UPDATE devices SET device_name = COALESCE(?, device_name), manufacturer = ? WHERE device_id = ?',
        [device_name || null, manufacturer ?? null, req.params.deviceId]
      );
    if (d.category === 'WEARABLE' && (battery_life !== undefined || sensor_type !== undefined)) {
      await pool.query('UPDATE wearables SET battery_life = ?, sensor_type = ? WHERE device_id = ?', [battery_life ?? null, sensor_type ?? null, req.params.deviceId]);
    }
    if (d.category === 'MOBILE' && os !== undefined) {
      await pool.query('UPDATE mobiles SET os = ? WHERE device_id = ?', [os ?? null, req.params.deviceId]);
    }
    res.json({ message: 'Device updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admin/devices/:deviceId', auth, async (req, res) => {
  if (req.user.user_type !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const [r] = await pool.query('DELETE FROM devices WHERE device_id = ?', [req.params.deviceId]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'Device not found' });
  res.json({ message: 'Device deleted' });
});

// ── MEMBER ROUTES ─────────────────────────────────────────────────────────────
router.get('/member/profile', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_member_profile WHERE user_id = ?', [req.user.user_id]);
  res.json(rows[0] || {});
});

router.get('/member/subscriptions', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_member_subscriptions WHERE member_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.get('/member/devices', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_member_devices WHERE member_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.get('/member/health-metrics', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_member_health_metrics WHERE member_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.get('/member/trainers', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_member_available_trainers');
  res.json(rows);
});

router.post('/member/health-metrics', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const { metric_type, value, unit, notes, device_id } = req.body;
  await pool.query(
    'INSERT INTO health_metrics (member_id, device_id, metric_type, value, unit, notes) VALUES (?,?,?,?,?,?)',
    [req.user.role_id, device_id || null, metric_type, value, unit, notes || null]
  );
  res.status(201).json({ message: 'Metric logged' });
});

router.patch('/member/health-metrics/:metricId', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const { metric_type, value, unit, notes, device_id } = req.body;
  try {
    const [[row]] = await pool.query('SELECT member_id FROM health_metrics WHERE metric_id = ?', [req.params.metricId]);
    if (!row) return res.status(404).json({ error: 'Metric not found' });
    if (row.member_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
    const fields = [];
    const params = [];
    if (metric_type !== undefined) { fields.push('metric_type = ?'); params.push(metric_type); }
    if (value !== undefined) { fields.push('value = ?'); params.push(value); }
    if (unit !== undefined) { fields.push('unit = ?'); params.push(unit); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (device_id !== undefined) { fields.push('device_id = ?'); params.push(device_id || null); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.metricId, req.user.role_id);
    await pool.query(`UPDATE health_metrics SET ${fields.join(', ')} WHERE metric_id = ? AND member_id = ?`, params);
    res.json({ message: 'Metric updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/member/health-metrics/:metricId', auth, async (req, res) => {
  if (req.user.user_type !== 'MEMBER') return res.status(403).json({ error: 'Forbidden' });
  const [[row]] = await pool.query('SELECT member_id FROM health_metrics WHERE metric_id = ?', [req.params.metricId]);
  if (!row) return res.status(404).json({ error: 'Metric not found' });
  if (row.member_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM health_metrics WHERE metric_id = ?', [req.params.metricId]);
  res.json({ message: 'Metric deleted' });
});

// ── TRAINER ROUTES ────────────────────────────────────────────────────────────
router.get('/trainer/profile', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_trainer_profile WHERE user_id = ?', [req.user.user_id]);
  res.json(rows[0] || {});
});

router.get('/trainer/sessions', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_trainer_sessions WHERE trainer_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.post('/trainer/sessions', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { session_date, duration, session_type, location, capacity } = req.body;
  await pool.query(
    'INSERT INTO sessions (trainer_id, session_date, duration, session_type, location, capacity) VALUES (?,?,?,?,?,?)',
    [req.user.role_id, session_date, duration, session_type, location || null, capacity || 1]
  );
  res.status(201).json({ message: 'Session created' });
});

router.get('/trainer/workout-plans', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_trainer_workout_plans WHERE trainer_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.post('/trainer/workout-plans', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { plan_name, difficulty, duration, goal_type, description } = req.body;
  await pool.query(
    'INSERT INTO workout_plans (trainer_id, plan_name, difficulty, duration, goal_type, description) VALUES (?,?,?,?,?,?)',
    [req.user.role_id, plan_name, difficulty, duration, goal_type, description || null]
  );
  res.status(201).json({ message: 'Workout plan created' });
});

router.get('/trainer/nutrition-plans', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_trainer_nutrition_plans WHERE trainer_id = ?', [req.user.role_id]);
  res.json(rows);
});

router.post('/trainer/nutrition-plans', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { plan_name, calorie_target, diet_type, duration_weeks, description } = req.body;
  await pool.query(
    'INSERT INTO nutrition_plans (trainer_id, plan_name, calorie_target, diet_type, duration_weeks, description) VALUES (?,?,?,?,?,?)',
    [req.user.role_id, plan_name, calorie_target || null, diet_type, duration_weeks, description || null]
  );
  res.status(201).json({ message: 'Nutrition plan created' });
});

router.put('/trainer/sessions/:sessionId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { session_date, duration, session_type, location, capacity } = req.body;
  const [[s]] = await pool.query('SELECT trainer_id FROM sessions WHERE session_id = ?', [req.params.sessionId]);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  if (s.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query(
    'UPDATE sessions SET session_date = COALESCE(?, session_date), duration = COALESCE(?, duration), session_type = COALESCE(?, session_type), location = ?, capacity = COALESCE(?, capacity) WHERE session_id = ?',
    [session_date || null, duration ?? null, session_type || null, location ?? null, capacity ?? null, req.params.sessionId]
  );
  res.json({ message: 'Session updated' });
});

router.delete('/trainer/sessions/:sessionId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [[s]] = await pool.query('SELECT trainer_id FROM sessions WHERE session_id = ?', [req.params.sessionId]);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  if (s.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM sessions WHERE session_id = ?', [req.params.sessionId]);
  res.json({ message: 'Session deleted' });
});

router.put('/trainer/workout-plans/:planId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { plan_name, difficulty, duration, goal_type, description } = req.body;
  const [[p]] = await pool.query('SELECT trainer_id FROM workout_plans WHERE plan_id = ?', [req.params.planId]);
  if (!p) return res.status(404).json({ error: 'Plan not found' });
  if (p.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query(
      'UPDATE workout_plans SET plan_name = COALESCE(?, plan_name), difficulty = COALESCE(?, difficulty), duration = COALESCE(?, duration), goal_type = COALESCE(?, goal_type), description = ? WHERE plan_id = ?',
      [plan_name || null, difficulty || null, duration ?? null, goal_type || null, description ?? null, req.params.planId]
    );
    res.json({ message: 'Workout plan updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Plan name already exists for this trainer' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/trainer/workout-plans/:planId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [[p]] = await pool.query('SELECT trainer_id FROM workout_plans WHERE plan_id = ?', [req.params.planId]);
  if (!p) return res.status(404).json({ error: 'Plan not found' });
  if (p.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM workout_plans WHERE plan_id = ?', [req.params.planId]);
  res.json({ message: 'Workout plan deleted' });
});

router.put('/trainer/nutrition-plans/:planId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const { plan_name, calorie_target, diet_type, duration_weeks, description } = req.body;
  const [[p]] = await pool.query('SELECT trainer_id FROM nutrition_plans WHERE nutrition_plan_id = ?', [req.params.planId]);
  if (!p) return res.status(404).json({ error: 'Plan not found' });
  if (p.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query(
      'UPDATE nutrition_plans SET plan_name = COALESCE(?, plan_name), calorie_target = ?, diet_type = COALESCE(?, diet_type), duration_weeks = COALESCE(?, duration_weeks), description = ? WHERE nutrition_plan_id = ?',
      [plan_name || null, calorie_target ?? null, diet_type || null, duration_weeks ?? null, description ?? null, req.params.planId]
    );
    res.json({ message: 'Nutrition plan updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Plan name already exists for this trainer' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/trainer/nutrition-plans/:planId', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [[p]] = await pool.query('SELECT trainer_id FROM nutrition_plans WHERE nutrition_plan_id = ?', [req.params.planId]);
  if (!p) return res.status(404).json({ error: 'Plan not found' });
  if (p.trainer_id !== req.user.role_id) return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM nutrition_plans WHERE nutrition_plan_id = ?', [req.params.planId]);
  res.json({ message: 'Nutrition plan deleted' });
});

router.get('/trainer/members-health', auth, async (req, res) => {
  if (req.user.user_type !== 'TRAINER') return res.status(403).json({ error: 'Forbidden' });
  const [rows] = await pool.query('SELECT * FROM v_trainer_members_health LIMIT 50');
  res.json(rows);
});

module.exports = router;
