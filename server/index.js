// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");

const pool = require('./db');
const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const userRoutes = require('./routes/users');
const rateRoutes = require('./routes/rates');
const branchRoutes = require('./routes/branches');
const reportRoutes = require('./routes/reports');
const updateRoutes = require('./routes/updates'); // <-- 1. IMPORT the new updates routes

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json()); 

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/updates', updateRoutes); // <-- 2. USE the new updates routes

// ... (Socket.IO and server listen logic remains the same)
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('joinRoom', (trackingNumber) => {
    socket.join(trackingNumber);
    console.log(`User ${socket.id} joined room for tracking# ${trackingNumber}`);
  });
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Successfully connected to PostgreSQL database.');
    }
  });
});
