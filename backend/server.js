// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://aditextingapp.vercel.app',
      'https://texting-pxwv4si66-aditya-kulkarni-s-projects-52b41b74.vercel.app'
    ],
    methods: ['GET', 'POST']
  }
});

// In-memory store (messages live only while server runs)
// Structure: { roomId: [ {id, nick, text, ts} ] }
const rooms = {};

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // Join chat room
  socket.on('join-room', ({ roomId, nick }) => {
    socket.join(roomId);
    socket.data.nick = nick || 'Anon';
    socket.data.roomId = roomId;

    // Send chat history
    const history = rooms[roomId] || [];
    socket.emit('room-history', history);

    // Notify others
    io.to(roomId).emit('user-joined', { id: socket.id, nick: socket.data.nick });
  });

  // Handle chat message
  socket.on('send-message', (payload) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const msg = {
      id: socket.id + '-' + Date.now(),
      nick: socket.data.nick || 'Anon',
      text: payload.text,
      ts: Date.now()
    };
    rooms[roomId] = rooms[roomId] || [];
    rooms[roomId].push(msg);
    io.to(roomId).emit('new-message', msg);
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('typing', {
      id: socket.id,
      nick: socket.data.nick,
      typing: isTyping
    });
  });

  // ===== VIDEO CALL SIGNALING =====
  socket.on('offer', (offer) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('offer', offer); // send to everyone else in room
  });

  socket.on('answer', (answer) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    console.log('socket disconnected:', socket.id);
    if (roomId) {
      socket.to(roomId).emit('user-left', { id: socket.id, nick: socket.data.nick });
    }
  });
});

// Optional health check endpoint
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server listening on', PORT));
