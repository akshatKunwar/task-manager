import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
    cors: {
        origin: "*", // Adjust this based on your frontend origin
        methods: ["GET", "POST"],
    },
});

app.use('/api', taskRoutes(io));
dotenv.config();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error(err));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', taskRoutes);
app.use('/api', notificationRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
