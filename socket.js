
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Chat from "./models/Chat.js"; 
import dotenv from "dotenv";

dotenv.config();

export const initializeSocket = (server) => { 
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
            console.log('User connected:', user.username);


            socket.on("joinRoom", async (roomId) => {
                socket.join(roomId);
                console.log(`User ${user.username} joined room: ${roomId}`);
            });


            socket.on("sendMessage", async (message) => {
                const {text,sender,roomId} = message;
                const chat = await Chat.create({
                    room:roomId,
                    user: decoded.id,
                    message: text
                });
                
                const populatedChat = await Chat.findById(chat._id).populate("user", "username email");
               
                console.log('Message saved to database:', chat);

                io.to(roomId).emit("newMessage", {sender,text}
                );
                            
            });
        }).catch(err => {
            console.log('Error fetching user:', err);
            socket.disconnect();
        });
    });
}