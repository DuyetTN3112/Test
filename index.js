require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();


app.use(express.json());

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false // Tắt log SQL để dễ theo dõi
  }
);

// Định nghĩa model Student
const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Tên không được để trống'
      },
      len: {
        args: [2, 50],
        msg: 'Tên phải có từ 2 đến 50 ký tự'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Email không hợp lệ'
      },
      notEmpty: {
        msg: 'Email không được để trống'
      }
    }
  },
  gpa: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'GPA không thể nhỏ hơn 0'
      },
      max: {
        args: [4],
        msg: 'GPA không thể lớn hơn 4'
      },
      notNull: {
        msg: 'GPA không được để trống'
      }
    }
  }
}, {
  tableName: 'students',
  timestamps: false // Tắt tự động thêm createdAt và updatedAt
});

// Middleware kết nối database và đồng bộ model
app.use(async (req, res, next) => {
  try {
    await sequelize.authenticate();
    await Student.sync(); // Đảm bảo bảng tồn tại
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Route GET /students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Route POST /students - Thêm mới sinh viên
app.post('/students', async (req, res) => {
  try {
    const { name, email, gpa } = req.body;
    
    // Sequelize sẽ tự động validate dữ liệu
    const newStudent = await Student.create({
      name,
      email,
      gpa: parseFloat(gpa)
    });
    
    res.status(201).json(newStudent);
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({ errors });
    }
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Route PUT /students/:id - Cập nhật sinh viên
app.put('/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, gpa } = req.body;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }
    
    // Cập nhật và validate
    await student.update({
      name,
      email,
      gpa: parseFloat(gpa)
    });
    
    res.json(student);
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({ errors });
    }
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Route DELETE /students/:id - Xóa sinh viên
app.delete('/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên' });
    }
    
    await student.destroy();
    res.json({ message: 'Xóa sinh viên thành công', student });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Khởi động server
// Sử dụng port từ .env hoặc mặc định là 3000 nếu không có
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  } catch (err) {
    console.error('Không thể kết nối database:', err);
  }
});