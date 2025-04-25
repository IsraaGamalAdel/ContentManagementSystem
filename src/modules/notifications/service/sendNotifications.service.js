import * as dbService from "../../../DB/db.service.js";
import { socketConnection, userModel } from "../../../DB/model/User.model.js";
import { notificationsModel } from "../../../DB/model/Notifications.model.js";
import { sendEmail, sendNotificationsEmail } from './../../../utils/email/sendEmail.js';
import { getIo } from "../notifications.socket.controller.js";





export const sendNotifications = async ({
    type, // 'create' أو 'update'
    senderId, 
    receiverId, 
    contentId, 
    firstName, 
    lastName,
    contentData 
}) => {
    const notificationMessages = {
        create: {
            dbMessage: `${firstName} ${lastName} tagged you in a new content`,
            emailSubject: `New Content Tag - ${contentData?.title || 'Untitled'}`,
            emailBody: `You've been tagged in a new content by ${firstName} ${lastName}.`,
            socketMessage: "New content tag notification"
        },
        update: {
            dbMessage: `${firstName} ${lastName} updated a content you're tagged in`,
            emailSubject: `Content Updated - ${contentData?.title || 'Untitled'}`,
            emailBody: `A content you're tagged in has been updated by ${firstName} ${lastName}.`,
            socketMessage: "Content update notification"
        }
    };

    const messageConfig = notificationMessages[type] || notificationMessages.create;

    const notification = await dbService.create({
        model: notificationsModel,
        data: {
            type: 'tag',
            sender: senderId,
            receiver: receiverId,
            content: contentId,
            metadata: {
                actionType: type,
                message: messageConfig.dbMessage,
                contentTitle: contentData?.title
            }
        }
    });
    
    await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: receiverId },
        data: {
            $push: { notifications: notification._id }
        }
    });
    
    const taggedUser = await dbService.findById({
        model: userModel,
        id: receiverId
    });
    
    if (taggedUser && taggedUser.email) {
        const emailContent = sendNotificationsEmail(`
            ${messageConfig.emailBody}
            Title: ${contentData?.title || 'No title'}
            ${contentData?.description ? `Description: ${contentData.description}` : ''}
        `);
        
        await sendEmail({
            to: taggedUser.email,
            subject: messageConfig.emailSubject,
            html: emailContent
        });
    }
    
    const userSocketId = socketConnection.get(receiverId.toString());
    if (userSocketId) {
        getIo().to(userSocketId).emit("newNotification", {
            notification,
            message: messageConfig.socketMessage
        });
    }
    
    return notification;
};



export const sendNotifications1 = async ({
    senderId, receiverId, contentId, firstName, lastName
}) => {
    const notification = await dbService.create({
        model: notificationsModel,
        data: {
            type: 'tag',
            sender: senderId,
            receiver: receiverId,
            content: contentId,
            metadata: {
                message: `${firstName} ${lastName} tagged you in a content`
            }
        }
    });
    
    await dbService.findOneAndUpdate({
        model: userModel,
        filter: { _id: receiverId },
        data: {
            $push: { notifications: notification._id }
        }
    });
    
    const taggedUser = await dbService.findById({
        model: userModel,
        id: receiverId
    });
    
    if (taggedUser && taggedUser.email) {
        const emailContent = sendNotificationsEmail(`
            You've been tagged in a new content by ${firstName} ${lastName}.
            Check it out!
        `);
        
        await sendEmail({
            to: taggedUser.email,
            subject: "You've been tagged in a new content",
            html: emailContent
        });
    }
    
    const userSocketId = socketConnection.get(receiverId.toString());
    if (userSocketId) {
        getIo().to(userSocketId).emit("newNotification", {
            notification,
            message: "You have a new notification!"
        });
    }
    
    return notification;
};


