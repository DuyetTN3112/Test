const express = require('express');
const mysql = require('mysql2/promise'); // Sử dụng promise interface
const app = express();
const PORT = 3000;

app.use(express.json());

// Cấu hình kết nối MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'test'
};

// Middleware kết nối database
app.use(async (req, res, next) => {
  try {
    req.db = await mysql.createConnection(dbConfig);
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Đóng kết nối sau mỗi request
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.db) req.db.end();
  });
  next();
});

// Route GET /students-from-db
app.get('/students-from-db', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Các route cũ vẫn giữ nguyên
app.get('/students', (req, res) => {
  res.json(students);
});

// 2. Route POST /students - Thêm mới sinh viên
app.post('/students', (req, res) => {
  const { name, email, gpa } = req.body;
  
  const newStudent = {
    id: students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1,
    name,
    email,
    gpa: parseFloat(gpa)
  };
  
  const validationErrors = validateStudent(newStudent);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }
  
  students.push(newStudent);
  res.status(201).json(newStudent);
});

// 3. Route PUT /students/:id - Cập nhật sinh viên
app.put('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, gpa } = req.body;
  
  const studentIndex = students.findIndex(s => s.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
  }
  
  const updatedStudent = {
    id,
    name,
    email,
    gpa: parseFloat(gpa)
  };
  
  const validationErrors = validateStudent(updatedStudent);
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }
  
  students[studentIndex] = updatedStudent;
  res.json(updatedStudent);
});

// 4. Route DELETE /students/:id - Xóa sinh viên
app.delete('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  const studentIndex = students.findIndex(s => s.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
  }
  
  const deletedStudent = students.splice(studentIndex, 1)[0];
  res.json({ message: 'Xóa sinh viên thành công', student: deletedStudent });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
