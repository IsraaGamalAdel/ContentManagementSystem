import * as dbService from '../../../DB/db.service.js';
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import cloudinary from './../../../utils/multer/cloudinary.js';
import { contentModel } from '../../../DB/model/ContentManagement.model.js';
import { successResponse } from './../../../utils/response/success.response.js';
import { roleTypes } from '../../../middleware/auth.middleware.js';
import { pagination } from './../../../utils/security/pagination.security.js';
import { socketConnection, userModel } from '../../../DB/model/User.model.js';
import { Types } from 'mongoose';
import { getIo } from '../../notifications/notifications.socket.controller.js';
import { notificationsModel } from '../../../DB/model/Notifications.model.js';
import {  sendEmail, sendNotificationsEmail } from '../../../utils/email/sendEmail.js';
import { sendNotifications } from '../../notifications/service/sendNotifications.service.js';




const populateList = [
    {path: 'userId' , select: "firstName lastName email image" },
    {
        path: 'comments' , 
        match: { commentId: {$exists: false} } ,
        populate: [
            {
                path: 'replies',
                match: { commentId: {$exists: false} } ,
                populate: [
                    {
                        path: 'replies',
                        match: { commentId: {$exists: false} } ,
                    }
                ]
            }
        ]
    },
    {path: 'tags' , select: "firstName lastName email image"  },
    { path: 'viewers',
        populate: {
            path: 'userId',
            select: "firstName lastName email image"
        }
    },
    {path: 'viewCount'}
];


// Create contentManagement
export const createContentManagement = errorAsyncHandler(
    async (req, res, next) => {
        if(req.files){

            // if (req.body.type !== 'image') {
            //     return next(new Error("Files can only be uploaded for image content", { cause: 400 }));
            // }
            
            const images = [];
            for (const file of req.files) {
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { 
                    folder: `${process.env.APP_NAME}/user/${req.user._id}/content`
                })
                images.push({secure_url , public_id});
            }
            req.body.images = images
        }

        if (req.body.tags) {
            let tagsArray = [];
            if (typeof req.body.tags === 'string' && req.body.tags.startsWith('[')) {
                try {
                    tagsArray = JSON.parse(req.body.tags);
                } catch (e) {
                    return next(new Error('Invalid tags format', { cause: 400 }));
                }
            }
            else if (Array.isArray(req.body.tags)) {
                tagsArray = req.body.tags;
            }
            else {
                tagsArray = [req.body.tags];
            }

            const tags = [];
            const uniqueTags = [...new Set(tagsArray)];

            for (const tag of uniqueTags) {
                if (typeof tag !== 'string' && !Types.ObjectId.isValid(tag)) {
                    return next(new Error(`Tag must be a valid user ID (ObjectId) or a username (string), but received: ${tag}`, { cause: 400 }));
                }

                const user = await dbService.findOne({
                    model: userModel,
                    filter: {
                        $or: [
                            { deleted: { $exists: false } },
                            { deleted: false }
                        ],
                        $or: [
                            Types.ObjectId.isValid(tag) ? { _id: new Types.ObjectId(tag) } : null,
                            typeof tag === 'string' ? { 
                                $expr: {
                                    $eq: [
                                        { $concat: ["$firstName", " ", "$lastName"] },
                                        tag.trim()
                                    ]
                                }
                            } : null
                        ].filter(Boolean)
                    },
                    select: '_id firstName lastName'
                });

                if (!user) {
                    return next(new Error(`User ${tag} not found or is deleted`, { cause: 404 }));
                }

                tags.push(user._id);
            }
            req.body.tags = tags;
        }

        const contentManagement = await dbService.create({
            model: contentModel,
            data: {
                ...req.body,
                userId: req.user._id,
            }
        });

        if (contentManagement.tags && contentManagement.tags.length > 0) {
            const notificationPromises = contentManagement.tags.map(async (tagId) => {
                await sendNotifications({
                    type: "create",
                    senderId: req.user._id,
                    receiverId: tagId,
                    contentId: contentManagement._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    contentData: {
                        title: contentManagement.title,
                        // description: contentManagement.description
                    }
                });
            });

            await Promise.all(notificationPromises);
        }

        const creatorSocketId = socketConnection.get(req.user._id.toString());
        if (creatorSocketId) {
            getIo().to(creatorSocketId).emit("newNotification", {
                content: contentManagement,
                message: "Your content was created successfully!"
            });
        }

        return successResponse({
            res,
            message: "Content created successfully",
            status: 201,
            data: { contentManagement }
        });
    }
);

// Update contentManagement
export const updateContentManagement = errorAsyncHandler(
    async (req , res , next) => {

        const content = await contentModel.findOne({
            _id: req.params.contentId,
            userId: req.user._id,
            deleted: { $exists: false }
        });
        
        if (!content) {
            return next(new Error("Content not found", { cause: 404 }));
        }
        
        if(req.files?.length){

            if (content.images?.length) {
                for (const image of content.images) {
                    await cloudinary.uploader.destroy(image.public_id).catch(console.error);
                }
            }

            const images = [];
            for (const file of req.files) {
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { 
                    folder: `${process.env.APP_NAME}/user/${req.user._id}/content`
                })
                images.push({secure_url , public_id});
            }
            req.body.images = images
        }


        if (req.body.tags) {

            let tagsArray = [];
            if (typeof req.body.tags === 'string' && req.body.tags.startsWith('[')) {
                try {
                    tagsArray = JSON.parse(req.body.tags);
                } catch (e) {
                    return next(new Error('Invalid tags format', { cause: 400 }));
                }
            }
            else if (Array.isArray(req.body.tags)) {
                tagsArray = req.body.tags;
            }
            else {
                tagsArray = [req.body.tags];
            }

            const tags = [];
            const uniqueTags = [...new Set(tagsArray)];

            for (const tag of uniqueTags) {
                if (typeof tag !== 'string' && !Types.ObjectId.isValid(tag)) {
                    return next(new Error(`Tag must be a valid user ID (ObjectId) or a username (string), but received: ${tag}`, { cause: 400 }));
                }

                const user = await dbService.findOne({
                    model: userModel,
                    filter: {
                        $or: [
                            { deleted: { $exists: false } },
                            { deleted: false }
                        ],
                        $or: [
                            Types.ObjectId.isValid(tag) ? { _id: new Types.ObjectId(tag) } : null,
                            typeof tag === 'string' ? { 
                                $expr: {
                                    $eq: [
                                        { $concat: ["$firstName", " ", "$lastName"] },
                                        tag.trim()
                                    ]
                                }
                            } : null
                        ].filter(Boolean)
                    },
                    select: '_id firstName lastName'
                });

                if (!user) {
                    return next(new Error(`User ${tag} not found or is deleted`, { cause: 404 }));
                }

                tags.push(user._id);
            }
            req.body.tags = tags;
        }

        const updatedContentManagement = await dbService.findOneAndUpdate({
            model: contentModel,
            filter: {
                _id: req.params.contentId,
                userId: req.user._id,
                deleted: {$exists: false},
            },
            data: {
                ...req.body,
            },
            options: {
                new: true
            }
        })


        if (updatedContentManagement.tags && updatedContentManagement.tags.length > 0) {
            const notificationPromises = updatedContentManagement.tags.map(async (tagId) => {
                await sendNotifications({
                    type: "Update Content",
                    senderId: req.user._id,
                    receiverId: tagId,
                    contentId: updatedContentManagement._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    contentData: {
                        title: updatedContentManagement.title,
                    }
                });
            });

            await Promise.all(notificationPromises);
        }

        const creatorSocketId = socketConnection.get(req.user._id.toString());
        if (creatorSocketId) {
            getIo().to(creatorSocketId).emit("newNotification", {
                content: updatedContentManagement,
                message: "Your content was updated successfully!"
            });
        }

        return successResponse({
            res,
            message: "Content updated successfully",
            status: 200,
            data: { updatedContentManagement }
        });
    }
);


// delete soft content
export const deleteContentManagement = errorAsyncHandler(
    async (req , res , next) => {

        const content = await contentModel.findOne({
            _id: req.params.contentId,
            userId: req.user._id,
            deleted: { $exists: false }
        });

        if (!content) {
            return next(new Error("Content not found", { cause: 404 }));
        }

        const owner = req.user.role === roleTypes.Admin ? {} : {userId: req.user._id}

        const deletedContentManagement = await dbService.findOneAndUpdate({
            model: contentModel,
            filter: {
                _id: req.params.contentId,
                deleted: {$exists: false},
                ...owner
            },
            data: {
                deleted: Date.now(),
                deletedBy: req.user._id,
            },
            options: {
                new: true
            }
        })

        return successResponse({
            res,
            message: "Content deleted successfully",
            status: 200,
            data: { deletedContentManagement }
        });
    }
);


// restore content
export const restoreContent = errorAsyncHandler(
    async (req , res , next) => {
        const content = await contentModel.findOne({
            _id: req.params.contentId,
            userId: req.user._id,
            deleted: { $exists: true }
        });

        if (!content) {
            return next(new Error("Content not found", { cause: 404 }));
        }

        const restoredContentManagement = await dbService.findOneAndUpdate({
            model: contentModel,
            filter: {
                _id: req.params.contentId,
                deleted: {$exists: true},
                deletedBy: req.user._id
            },
            data: {
                $unset: {
                    deleted: 0,
                    deletedBy: 0
                }
            },
            options: {
                new: true
            }
        })


        return successResponse({
            res,
            message: "Content restored successfully",
            status: 200,
            data: { restoredContentManagement }
        });
    }
);


export const getAllContentManagement = errorAsyncHandler(
    async (req , res , next) => {

        const {page , size} = req.query;

        const data = await pagination({
            model: contentModel,
            filter: {
                deleted: {$exists: false},
            },
            page,
            size: size,
            populate: populateList,
            select: 'title type createdAt views commentsCount userId tags'
        })

        if(data?.data?.length) {
            await contentModel.updateMany(
                { _id: { $in: data.data.map(item => item._id) } },
                { $inc: { views: 1 } }
            );
        }

        return successResponse({
            res,
            message: "Welcome User to your account ( Get all contentManagement)",
            status: 200,
            data: {data}
        })
    }
);

