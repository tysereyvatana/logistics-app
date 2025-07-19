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
const updateRoutes = require('./routes/updates');

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
app.use('/api/updates', updateRoutes);

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (trackingNumber) => {
    socket.join(trackingNumber);
    console.log(`User ${socket.id} joined room for tracking# ${trackingNumber}`);
  });

  socket.on('join_shipments_room', () => {
    socket.join('shipments_room');
    console.log(`User ${socket.id} joined the main shipments room.`);
  });

  socket.on('join_users_room', () => {
    socket.join('users_room');
    console.log(`User ${socket.id} joined the users management room.`);
  });

  socket.on('join_rates_room', () => {
    socket.join('rates_room');
    console.log(`User ${socket.id} joined the rates management room.`);
  });

  // --- NEW: For real-time updates on the BranchManagementPage ---
  socket.on('join_branches_room', () => {
    socket.join('branches_room');
    console.log(`User ${socket.id} joined the branches management room.`);
  });

  socket.on('join_client_room', (userId) => {
    const roomName = `client_${userId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined client room: ${roomName}`);
  });

  socket.on('join_session_room', (sessionRoom) => {
    socket.join(sessionRoom);
    console.log(`User ${socket.id} joined session room: ${sessionRoom}`);
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
