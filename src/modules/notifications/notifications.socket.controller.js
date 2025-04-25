import { Server } from 'socket.io';
import { logOutSocket, registerSocketEvents } from './service/notifications.auth.service.js';
import { sendNotifications } from './service/sendNotifications.service.js';


let io = undefined;


export const runIo = async (httpServer) => {

    io = new Server(httpServer, {
        cors: {
            origin: '*',
        }
    });

    
    return io.on('connection',  async (socket) => {
        console.log('A user connected:', socket.id);
        console.log('Auth Token:', socket.handshake.auth);
        await registerSocketEvents( socket );
        // sendNotifications( socket );
        await logOutSocket( socket );
    });
};

export const getIo = () => {
    return io;
};