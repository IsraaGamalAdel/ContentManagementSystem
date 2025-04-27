import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from './../../../utils/response/success.response.js';
import * as dbService from '../../../DB/db.service.js';
import cloudinary from './../../../utils/multer/cloudinary.js';
import { roleTypes } from './../../../middleware/auth.middleware.js';
import { contentModel } from "../../../DB/model/ContentManagement.model.js";
import { commentModel } from './../../../DB/model/Comment.model.js';
import { socketConnection, userModel } from './../../../DB/model/User.model.js';
import { Types } from 'mongoose';
import { sendNotifications } from "../../notifications/service/sendNotifications.service.js";
import { getIo } from "../../notifications/notifications.socket.controller.js";



export const createComment = errorAsyncHandler(
    async (req , res ,next) => {
        const {contentId , commentId} = req.params;

        if(commentId){
            const checkComment = await dbService.findOne({
                model: commentModel,
                filter: {
                    _id: commentId,
                    contentId: contentId,
                    deleted: {$exists: false}
                }
            })
            if(!checkComment){
                return next(new Error("Can not reply , Comment not found" , {cause: 404}))
            }
            req.body.commentId = commentId
        }

        const content = await dbService.findOne({
            model: contentModel,
            filter: {
                _id: contentId ,
                deleted: {$exists: false}
            }
        })

        if(!content){
            return next(new Error("content not found" , {cause: 404}))
        }

        if(req.files?.length){
            const images = [];
            for (const file of req.files){
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path ,
                        { folder: `${process.env.APP_NAME}/user/${content.userId}/content/comment`}
                    );
                images.push({secure_url , public_id})
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

        const comment = await dbService.create({
            model: commentModel,
            data: {
                ...req.body,
                contentId: contentId,
                userId: req.user._id
            }
        })

        if (comment.tags && comment.tags.length > 0) {
            const notificationPromises = comment.tags.map(async (tagId) => {
                await sendNotifications({
                    type: "create comment",
                    senderId: req.user._id,
                    receiverId: tagId,
                    contentId: comment._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    contentData: {
                        title: comment.title,
                        // description: comment.description
                    }
                });
            });
        
            await Promise.all(notificationPromises);
        }
        
        const creatorSocketId = socketConnection.get(req.user._id.toString());
        if (creatorSocketId) {
            getIo().to(creatorSocketId).emit("newNotification", {
                content: comment,
                message: "Your content was created successfully!"
            });
        }

        return successResponse({res ,message: 'Comment created successfully' , status: 201 , data: {comment} });
        
    }
);


export const updateComment = errorAsyncHandler(
    async (req , res ,next) => {
        const {contentId ,commentId} = req.params;

        const comment = await dbService.findOne({
            model: commentModel,
            filter: {
                _id: commentId ,
                contentId: contentId,
                deleted: {$exists: false}
            },
            populate: [{
                path: "contentId",
            }]
        }) 

        if(!comment || comment.contentId.deleted){
            return next(new Error("Comment not found" , {cause: 404}));
        }

        if(req.files?.length){

            if (comment.images?.length) {
                for (const image of comment.images) {
                    await cloudinary.uploader.destroy(image.public_id).catch(console.error);
                }
            }

            const images = [];
            for (const file of req.files){
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path ,
                        { folder: `${process.env.APP_NAME}/user/${comment.contentId.userId}/content/comment`}
                    );
                images.push({secure_url , public_id})
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

        
        const updateComment = await dbService.findOneAndUpdate({
            model: commentModel,
            filter: {
                _id: commentId ,
                contentId: contentId,
                deleted: {$exists: false}
            },
            data: req.body,
            options: {
                new: true
            }
        })


        if (updateComment.tags && updateComment.tags.length > 0) {
            const notificationPromises = updateComment.tags.map(async (tagId) => {
                await sendNotifications({
                    type: "create updateComment",
                    senderId: req.user._id,
                    receiverId: tagId,
                    contentId: updateComment._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    contentData: {
                        title: updateComment.title,
                        // description: updateComment.description
                    }
                });
            });
        
            await Promise.all(notificationPromises);
        }
        
        const creatorSocketId = socketConnection.get(req.user._id.toString());
        if (creatorSocketId) {
            getIo().to(creatorSocketId).emit("newNotification", {
                content: updateComment,
                message: "Your content was created successfully!"
            });
        }


        return successResponse({res ,message: 'updateComment updated successfully' , status: 201 , data: {comment: updateComment} });
        
    }
);


export const freezeComment = errorAsyncHandler(
    async (req , res ,next) => {
        const {contentId ,commentId} = req.params;

        const comment = await dbService.findOne({
            model: commentModel,
            filter: {
                _id: commentId ,
                contentId: contentId,
                deleted: {$exists: false}
            },
            populate: [{
                path: "contentId",
            }]
        }) 

        if (!comment) {
            return next(new Error("Comment not found", {cause: 404}));
        }
        
        const isAdmin = req.user.role === roleTypes.Admin;
        const isCommentAuthor = req.user._id.toString() === comment.userId.toString();
        const isContentOwner = req.user._id.toString() === comment.contentId.userId.toString();
        
        if (!isAdmin && !isCommentAuthor && !isContentOwner) {
            return next(new Error("Not Authorized to freeze this comment", {cause: 403}));
        }
        const updateComment = await dbService.findOneAndUpdate({
            model: commentModel,
            filter: {
                _id: commentId ,
                contentId: contentId,
                deleted: {$exists: false}
            },
            data: {
                deleted: Date.now(),
                deletedBy: req.user._id
            },
            options: {
                new: true
            }
        })


        return successResponse({res ,message: 'Comment freezed successfully' , status: 200 , data: {comment: updateComment} });
        
    }
);


export const unFreezeComment = errorAsyncHandler(
    async (req , res ,next) => {
        const {contentId ,commentId} = req.params;

        const updateComment = await dbService.findOneAndUpdate({
            model: commentModel,
            filter: {
                _id: commentId ,
                contentId: contentId,
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

        return successResponse({res ,message: 'Comment unFreezed successfully' , status: 200 , data: {comment: updateComment} });
    }
);


