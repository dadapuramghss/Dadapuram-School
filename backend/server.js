require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

// Override DNS to use Google's DNS to bypass local SRV block on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

const studentRoutes = require('./routes/studentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const studentPortalRoutes = require('./routes/studentPortalRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const circularRoutes = require('./routes/circularRoutes');
const classConfigRoutes = require('./routes/classConfigRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const materialRoutes = require('./routes/materialRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Add io to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ limit: '8mb', extended: true }));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


// Routes
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/classes', classConfigRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/feedback', feedbackRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('EduPulse API is running');
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edupulse';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Warning: Database features will not work until connection is restored.');
  });

// Socket connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Always start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
