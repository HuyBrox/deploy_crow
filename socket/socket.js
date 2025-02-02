import { Server } from "socket.io";
import express from "express";
import http from "http";
import mongoose from 'mongoose';
import User from '../models/user.model.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const io = new Server(server, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
});

// Hàm chuyển userId thành ObjectId nếu cần
const convertToObjectId = (userId) => new mongoose.Types.ObjectId(userId);

// Danh sách socket của từng user
const userSocketMap = {};

// Hàm cập nhật trạng thái hoạt động của user
const updateLastActiveTime = async (userId) => {
    try {
        const userObj = convertToObjectId(userId);
        await User.findByIdAndUpdate(userObj, { lastActiveAt: new Date() });
    } catch (error) {
        console.error("Lỗi khi cập nhật thời gian hoạt động cuối: ", error);
    }
};

// Trả về danh sách socket của user
export const getReciverSocketIds = (userId) => {
    return userSocketMap[userId] ? Array.from(userSocketMap[userId]) : [];
};

// Xử lý khi user kết nối
const handleUserConnection = async (socket, userId) => {
    if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
    }
    userSocketMap[userId].add(socket.id);

    await updateLastActiveTime(userId);
    console.log(`🔗 User kết nối: ${userId} | Socket: ${socket.id}`);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
};

// Xử lý khi user ngắt kết nối
const handleUserDisconnection = async (socket, userId) => {
    if (userSocketMap[userId]) {
        userSocketMap[userId].delete(socket.id);
        if (userSocketMap[userId].size === 0) {
            delete userSocketMap[userId];
        }
    }

    await updateLastActiveTime(userId);
    console.log(`❌ User ngắt kết nối: ${userId} | Socket: ${socket.id}`);

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
};

// Xử lý tin nhắn
const handleChatMessage = (socket, { receiverId, message, senderId }) => {
    const receiverSockets = getReciverSocketIds(receiverId);
    receiverSockets.forEach(socketId => {
        io.to(socketId).emit("newMessage", { senderId, message, timestamp: new Date() });
    });
};

// Xử lý phản hồi cuộc gọi
const handleCallResponse = (socket, { callerId, receiverId, accepted }) => {
    const callerSockets = getReciverSocketIds(callerId);
    callerSockets.forEach(socketId => {
        io.to(socketId).emit("callResponse", { receiverId, accepted });
    });

    if (accepted) {
        socket.join(`call_${callerId}_${receiverId}`);
        console.log(`📞 Người nhận (${receiverId}) đã tham gia phòng call_${callerId}_${receiverId}`);
    } else {
        console.log(`❌ Người nhận (${receiverId}) đã từ chối cuộc gọi.`);
    }
};

// Xử lý notification
const handleNotification = (socket, { receiverId, notification }) => {
    const receiverSockets = getReciverSocketIds(receiverId);
    receiverSockets.forEach(socketId => {
        io.to(socketId).emit("notification", notification);
    });
};

// Xử lý kết nối Socket.IO
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
        console.log("⚠️ Kết nối từ chối: Không có userId");
        socket.disconnect();
        return;
    }

    handleUserConnection(socket, userId);

    socket.on("sendMessage", (data) => handleChatMessage(socket, data));
    socket.on("respondToCall", (data) => handleCallResponse(socket, data));
    socket.on("sendNotification", (data) => handleNotification(socket, data));

    // WebRTC - gửi offer
    socket.on("sendOffer", async (data) => {
        const receiverSockets = getReciverSocketIds(data.receiverId);
        if (receiverSockets.length > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit("receiveOffer", { callerId: data.callerId, offer: data.offer });
            });
        } else {
            socket.emit("callError", { message: "Người nhận không trực tuyến." });
        }
    });

    // WebRTC - gửi answer
    socket.on("sendAnswer", async (data) => {
        const callerSockets = getReciverSocketIds(data.callerId);
        callerSockets.forEach(socketId => {
            io.to(socketId).emit("receiveAnswer", { receiverId: data.receiverId, answer: data.answer });
        });
    });

    // WebRTC - gửi Ice Candidate
    socket.on("sendIceCandidate", async (data) => {
        const targetSockets = getReciverSocketIds(data.targetId);
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("receiveIceCandidate", { candidate: data.candidate });
        });
    });

    socket.on("disconnect", () => {
        handleUserDisconnection(socket, userId);
    });

    socket.on("error", (err) => {
        console.error(`⚠️ Lỗi socket: userId=${userId}, socketId=${socket.id}, lỗi=`, err);
    });
});

export { io, server, app };
