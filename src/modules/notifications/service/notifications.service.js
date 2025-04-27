import { notificationsModel } from "../../../DB/model/Notifications.model.js";
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import * as dbService from "../../../DB/db.service.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { socketConnection } from "../../../DB/model/User.model.js";
import { getIo } from "../notifications.socket.controller.js";



export const notificationAsRead1 = errorAsyncHandler(async (req, res, next) => {
    const { notificationId } = req.params;
    
    const updatedNotification = await dbService.findOneAndUpdate({
        model: notificationsModel,
        filter: { 
            _id: notificationId, 
            receiver: req.user._id,
        },
        data: { $set: {readBy: { user: req.user._id }} ,},
        options: { new: true }
    });

    if (!updatedNotification) {
        return next(new Error("Notification not found or access denied", { cause: 404 }));
    }

    const userSocketId = socketConnection.get(req.user._id.toString());
    if (userSocketId) {
        getIo().to(userSocketId).emit("notificationRead", { 
            notificationId,
            readBy: updatedNotification.readBy
        });
    }

    return successResponse({ 
        res, 
        message: "Notification marked as read",
        data: { notification: updatedNotification }
    });
});



export const notificationAsRead = errorAsyncHandler( async (req, res, next) => {
    const { notificationId } = req.params;

    const notification = await dbService.findById({
        model: notificationsModel,
        id: notificationId,
        populate: ['sender', 'receiver', 'content']
    });

    if (!notification) {
        return next(new Error("Notification not found", { cause: 404 }));
    }

    // if (!notification.receiver._id.equals(req.user._id)) {
    //     return next(new Error("Unauthorized access", { cause: 403 }));
    // }

    const updatedNotification = await dbService.findOneAndUpdate({
        model: notificationsModel,
        filter: { _id: notificationId },
        data: {
            $set: { readBy: { user: req.user._id , readAt: new Date() } }
        },
        options: { 
            new: true ,
        }
    });

    const senderSocketId = socketConnection.get(notification.sender._id.toString());
    const receiverSocketId = socketConnection.get(notification.receiver._id.toString());

    const notificationData = {
        _id: notificationId,
        readBy: updatedNotification.readBy
    };

    if (senderSocketId) {
        getIo().to(senderSocketId).emit("notificationRead", {
            type: 'read',
            notification: notificationData
        });
    }

    if (receiverSocketId) {
        getIo().to(receiverSocketId).emit("notificationRead", {
            type: 'read',
            notification: notificationData
        });
    }

    return successResponse({ 
        res, 
        message: "Notification as read",
        data: { notification: updatedNotification }
    });
});

