// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// ✅ Allow both production + local dev origins
const allowedOrigins = [
  'https://aditextingapp.vercel.app',
  'https://texting-pxwv4si66-aditya-kulkarni-s-projects-52b41b74.vercel.app',
  'https://texting1.vercel.app',
  'http://localhost:5173', // Vite
  'http://localhost:3000'  // React CRA
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory store (messages live only while server runs)
// Structure: { roomId: [ {id, nick, text, ts} ] }
const rooms = {};

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // ===== JOIN ROOM =====
  socket.on('join-room', ({ roomId, nick }) => {
    socket.join(roomId);
    socket.data.nick = nick || 'Anon';
    socket.data.roomId = roomId;

    // Send chat history
    const history = rooms[roomId] || [];
    socket.emit('room-history', history);

    // Notify others
    io.to(roomId).emit('user-joined', {
      id: socket.id,
      nick: socket.data.nick
    });
  });

  // ===== CHAT MESSAGE =====
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

  // ===== TYPING INDICATOR =====
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
    socket.to(roomId).emit('offer', offer);
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

  // ===== DISCONNECT =====
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    console.log('socket disconnected:', socket.id);

    if (roomId) {
      socket.to(roomId).emit('user-left', {
        id: socket.id,
        nick: socket.data.nick
      });
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server listening on', PORT));
