import { Server } from "socket.io";

let io;

export default function handler(req, res) {
    if (!res.socket.server.io) {
        console.log("Starting Socket.IO server...");
        io = new Server(res.socket.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });

        io.on("connection", (socket) => {
            console.log(`New client connected: ${socket.id}`);

            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });

        res.socket.server.io = io;
    }
    res.end();
}

export { io };
