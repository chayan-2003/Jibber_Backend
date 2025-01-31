
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Chat from "./models/Chat.js"; 
import dotenv from "dotenv";
import { set } from "mongoose";
import { json } from "express";

dotenv.config();

export const initializeSocket = (server) => { 
    const onlineUsers = new Set();
    const typingUsers = new Set();
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:3000",  "https://joyful-froyo-69e8c4.netlify.app"],
            methods: ["GET", "POST"],
            credentials: true,
        },
      
    });

    io.on("connection", (socket) => {
        const token = socket.handshake.auth.user.token;
        if (!token) {
            console.log('No token provided, disconnecting socket');
            socket.disconnect();
            return;
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.log('Invalid token, disconnecting socket');
            socket.disconnect();
            return;
        }

        User.findById(decoded.id).select("username").then(user => {
            if (!user) {
                console.log('User not found, disconnecting socket');
                socket.disconnect();
                return;
            }

            socket.user = user;
      


            socket.on("joinRoom", async (roomId) => {
                socket.join(roomId);
                console.log(`User ${user.username} joined room: ${roomId}`);
                onlineUsers.add(user.id);
                io.to(roomId).emit("onlineUsers", Array.from(onlineUsers));
                console.log('Online users:', Array.from(onlineUsers));

                 
            });
            socket.on("typing", ({ sender, roomId }) => {
              
                typingUsers.add(sender);
                io.to(roomId).emit("userTyping", Array.from(typingUsers)); 
                console.log(`User ${sender} is typing in room ${roomId}`);
            });
            socket.on("stopTyping", ({ sender, roomId }) => {
                typingUsers.delete(sender);
                io.to(roomId).emit("userTyping", Array.from(typingUsers));
                console.log(`User ${sender} stopped typing in room ${roomId}`);
            });
            



            socket.on("sendMessage", async (message) => {
                const {text,sender,roomId} = message;
                const chat = await Chat.create({
                    room:roomId,
                    user: decoded.id,
                    message: text,
      
                });
                
                const populatedChat = await Chat.findById(chat._id).populate("user", "username email");
               
                console.log('Message saved to database:', chat);
                
                io.to(roomId).emit("newMessage", {sender,text});
                
                            
            });
        }).catch(err => {
            console.log('Error fetching user:', err);
            socket.disconnect();
        });
    });
}