const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);

// Get client URL from environment variable or use default for development
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

// Store active users and their rooms
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('join_room', ({ username, room }) => {
    socket.join(room);
    users.set(socket.id, { username, room });
    
    // Add user to room
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);

    // Notify room about new user
    io.to(room).emit('user_joined', {
      username,
      message: `${username} has joined ${room}`,
      users: Array.from(rooms.get(room)).map(id => users.get(id).username)
    });
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const messageData = {
        id: uuidv4(),
        message: data.message,
        username: user.username,
        time: new Date().toISOString(),
        replyTo: data.replyTo
      };
      
      io.to(data.room).emit('receive_message', messageData);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { username, room } = user;
      if (rooms.has(room)) {
        rooms.get(room).delete(socket.id);
        if (rooms.get(room).size === 0) {
          rooms.delete(room);
        } else {
          io.to(room).emit('user_left', {
            username,
            message: `${username} has left the room`,
            users: Array.from(rooms.get(room)).map(id => users.get(id).username)
          });
        }
      }
      users.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    throw err;
  }
});
