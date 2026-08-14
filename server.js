const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL Database connection pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345678', // Hardcoded DB Password for simplicity
  database: 'school_management_system',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'simple_student_portal_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
}));

// Route: Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware to check login status
const checkLogin = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.status(401).json({ success: false, message: 'Unauthorized login required' });
};

// ─── AUTHENTICATION APIs ────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ success: false, message: 'User not found' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' });

    let extraId = null;
    if (user.role === 'student') {
      const [stus] = await db.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (stus.length > 0) extraId = stus[0].id;
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      extra_id: extraId
    };
    res.json({ success: true, user: req.session.user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json({ success: true, user: req.session.user });
  res.status(401).json({ success: false });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ─── DASHBOARD STATS API ─────────────────────────────────────────────────────

app.get('/api/stats', checkLogin, async (req, res) => {
  try {
    const [[students]] = await db.query('SELECT COUNT(*) AS count FROM students');
    const [[teachers]] = await db.query('SELECT COUNT(*) AS count FROM users WHERE role = "teacher"');
    const [classes] = await db.query('SELECT DISTINCT class_name FROM students');
    const [[users]] = await db.query('SELECT COUNT(*) AS count FROM users');

    res.json({
      success: true,
      students: students.count,
      teachers: teachers.count,
      classes: classes.length,
      users: users.count
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── STUDENTS APIs ───────────────────────────────────────────────────────────

app.get('/api/students', checkLogin, async (req, res) => {
  try {
    const { search = '', class_name = '' } = req.query;
    let query = 'SELECT s.*, u.username, u.email FROM students s INNER JOIN users u ON s.user_id = u.id WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND s.full_name LIKE ?';
      params.push(`%${search}%`);
    }
    if (class_name) {
      query += ' AND s.class_name = ?';
      params.push(class_name);
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/students', checkLogin, async (req, res) => {
  try {
    const { full_name, username, email, class_name, roll_number, address } = req.body;
    const hash = await bcrypt.hash('Student@123', 10);

    const [userRes] = await db.query(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, "student")',
      [username, hash, email]
    );
    await db.query(
      'INSERT INTO students (user_id, full_name, class_name, roll_number, address) VALUES (?, ?, ?, ?, ?)',
      [userRes.insertId, full_name, class_name, roll_number, address]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/students/:id', checkLogin, async (req, res) => {
  try {
    const [stus] = await db.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (stus.length > 0) {
      await db.query('DELETE FROM users WHERE id = ?', [stus[0].user_id]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── TEACHERS APIs ───────────────────────────────────────────────────────────

app.get('/api/teachers', checkLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, email, role FROM users WHERE role = "teacher"');
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/teachers', checkLogin, async (req, res) => {
  try {
    const { username, email } = req.body;
    const hash = await bcrypt.hash('Teacher@123', 10);
    await db.query(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, "teacher")',
      [username, hash, email]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/teachers/:id', checkLogin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── ATTENDANCE APIs ─────────────────────────────────────────────────────────

app.get('/api/attendance/students/:className', checkLogin, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const [rows] = await db.query(
      `SELECT s.id AS student_id, s.roll_number, s.full_name, a.status AS today_status
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
       WHERE s.class_name = ?`,
      [date, req.params.className]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/attendance', checkLogin, async (req, res) => {
  try {
    const { date, attendance } = req.body;
    for (const item of attendance) {
      await db.query(
        `INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [item.student_id, date, item.status]
      );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── MARKS APIs ──────────────────────────────────────────────────────────────

app.get('/api/marks', checkLogin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, s.full_name, s.class_name, s.roll_number
       FROM marks m
       INNER JOIN students s ON m.student_id = s.id`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/marks', checkLogin, async (req, res) => {
  try {
    const { student_id, subject_name, marks_obtained, exam_type } = req.body;
    await db.query(
      `INSERT INTO marks (student_id, subject_name, marks_obtained, exam_type) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained)`,
      [student_id, subject_name, marks_obtained, exam_type]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/marks/result/:studentId', checkLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM marks WHERE student_id = ?', [req.params.studentId]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── PROFILE APIs ────────────────────────────────────────────────────────────

app.get('/api/profile', checkLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/profile/change-password', checkLogin, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.session.user.id]);
    const user = rows[0];

    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Incorrect current password' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Kendriya Vidyalaya basic server running at http://localhost:${PORT}`);
});
