import * as dbService from "../../../DB/db.service.js";
import { contentModel } from "../../../DB/model/ContentManagement.model.js";
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from "../../../utils/response/success.response.js";
import { decodeEncryption, generateEncryption } from "../../../utils/security/encryption.security.js";
import { generateCharts, getLast7DaysViews } from './chartJs.service.js';
import { compareHash, generateHash } from './../../../utils/security/hash.security.js';
import { userModel } from "../../../DB/model/User.model.js";
import { emailEvent } from './../../../utils/events/sendEmailEvent.js';
import cloudinary from './../../../utils/multer/cloudinary.js';
import { timeCodeOTP } from './../../../middleware/timeCode.middleware.js';




export const viewersContent = errorAsyncHandler(
    async (req, res, next) => {
        const { contentId } = req.params;
        const userAgent = req.headers['user-agent'];
        const deviceType = userAgent.match(/Mobile|Android|iPhone|iPad|iPod/) ? 'Mobile' : 'Desktop';


        let content = await dbService.findOne({
            model: contentModel,
            filter: { 
                _id: contentId ,
                deleted: {$exists: false}
            },
            populate: [
                { path: 'userId', select: 'firstName lastName email' },
                { path: 'viewers.userId', select: 'firstName lastName email' }
            ]
        });

        if (!content) {
            return next(new Error("Content not found", { cause: 404 }));
        }

        const duration = 1 * 60 * 1000;

        if (content.userId._id.toString() !== req.user._id.toString()) {

            const result = await dbService.updateOne({
                model: contentModel,
                filter: { _id: contentId },
                data: {
                    $push: {
                        viewers: {
                            userId: req.user._id,
                            time: Date.now(),
                            deviceType: deviceType,
                            sessionStart: Date.now(),
                            sessionEnd: Date.now() + duration 
                        }
                    },
                    $inc: { viewCount: 1 }
                },
                options: { new: true }
            });

            content = await dbService.findOne({
                model: contentModel,
                filter: { _id: contentId },
                populate: [
                    { path: 'userId', select: 'firstName lastName email' },
                    { path: 'viewers.userId', select: 'firstName lastName email' }
                ]
            });
        }
        
        
        return successResponse({
            res,
            message: "Content details with analytics",
            data: {
                content
            }
        });
    }
);


export const contentAnalytics = errorAsyncHandler(
    async (req, res, next) => {
        const { contentId } = req.params;

        const content = await dbService.findOne({
            model: contentModel,
            filter: { _id: contentId },
            populate: { path: 'viewers.userId', select: 'firstName lastName' }
        });

        if (!content) return next(new Error("Content not found", { cause: 404 }));

        const deviceStats = content.viewers.reduce((acc, viewer) => {
            const deviceType = viewer.deviceType || 'Unknown'; 
            acc[deviceType] = (acc[deviceType] || 0) + 1;
            return acc;
        }, {});

        const avgTimeSpent = content.viewers.length > 0 
        ? content.viewers.reduce((acc, viewer) => {
            return acc + ((viewer.sessionEnd || Date.now()) - viewer.sessionStart);
        }, 0) / content.viewers.length
        : 0;

        const viewersPerDay = getLast7DaysViews(content.viewers);

        const analyticsData = {
            totalViews: content.viewCount,
            devices: deviceStats,
            avgTimeSpent: `${(avgTimeSpent / 1000 / 60).toFixed(2)} minutes`,
            viewersPerDay: viewersPerDay
        };

        const chartsData = generateCharts(analyticsData);

        return successResponse({
            res,
            data: {
                ...analyticsData,
                charts: chartsData //  Send the generated charts data
            }
        });
    }
);

// Profile
export const userProfile = errorAsyncHandler(
    async (req , res , next) => {

        const user = await dbService.findOne({
            model: userModel,
            filter: {_id: req.user._id} ,
        })

        if(!user){
            return next(new Error("In_valid account user not found" , {cause: 404}));
        }
        user.phone = decodeEncryption({
            cipherText: user.phone
        })

        return successResponse({ 
            res, message: "Welcome User to your account (profile)" ,
            status:200 , 
            data: {users: user}
        });
    }
);


// Update Profile
export const UpdateUserProfile = errorAsyncHandler(
    async (req , res , next) => {
        
        if(req.body.phone){
            req.body.phone = generateEncryption({plainText: req.user.phone})
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id:  req.user._id,
            data: req.body,
            options: {
                new : true , 
                runValidators: true
            }
        })

        return successResponse({ res, message: "Welcome User to your account ( Update profile)" , status:200 , data: {user}});
    }
);

// Update Password
export const UpdatePassword = errorAsyncHandler(
    async (req , res , next) => {
        const {oldPassword , password} = req.body;

        if(!compareHash({plainText: oldPassword , hashValue: req.user.password})){
            return next(new Error("In_valid account user old password not match " ,{cause: 400}));
        }

        const hashPassword = generateHash({plainText: password});

        await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: {password: hashPassword , changeCredentialsTime: Date.now()},
            options: {new: true , runValidators: true}
        })

        return successResponse({ res, message: "Welcome User to your account ( Update password to profile)" , status:200 });
    }
);

// Update Email
export const UpdateEmail = errorAsyncHandler(
    async (req , res , next) => {
        const {email} = req.body;

        if( await dbService.findOne({model: userModel, filter: {email}})){
            return next(new Error(`Email ${email} already exist` , {cause: 409}));
        }

        await dbService.updateOne({
            model: userModel,
            filter: {_id: req.user._id},
            data: {
                tempEmail: email
            }
        })
        emailEvent.emit("sendUpdateEmail" , {id: req.user._id ,email})  //send code to email the new account
        emailEvent.emit("sendConfirmEmail" , {id: req.user._id ,email: req.user.email})  // send code to old account

        return successResponse({ res, message: "Welcome User to your account ( Update password to profile)" , status:200 });
    }
);

export const replaceEmail = errorAsyncHandler(
    async (req , res , next) => {
        const { oldEmailCode , code} = req.body;

        const user = await dbService.findOne({ model: userModel, filter: { _id: req.user._id } });

        if (!user) {
            return next(new Error("User not found", { cause: 404 }));
        }

        if( await dbService.findOne({model: userModel, filter: {email: req.user.tempEmail}})){
            return next(new Error(`Email ${email} already exist` , {cause: 409}));
        }

        // Validate old email code , email code القديم  (email code القديم )
        await timeCodeOTP(user, oldEmailCode, 'emailOTP');

        // Validate new email code , code الجديد (email update code)
        await timeCodeOTP(user, code, 'updateEmailOTP');

        await dbService.updateOne({
            model: userModel,
            filter: {_id: req.user._id},
            data: {
                email: req.user.tempEmail,
                changeCredentialsTime: Date.now(),
                $unset: {
                    tempEmail: 0,
                    updateEmailOTP: 0,
                    emailOTP: 0
                }
            }
        })

        return successResponse({ res, message: "Welcome User to your account ( Update email to profile)" , status:200 });
    }
);


// delete عند التسليم 
// Images
export const updateImages = errorAsyncHandler(
    async (req , res , next) => {

        const {secure_url , public_id} = await cloudinary.uploader.upload(req.file.path , { folder: `users/${req.user._id}`});

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            data: {
                image: {secure_url , public_id},
            },
            options: {new: false}
        })

        if(user.image?.public_id){
            await cloudinary.uploader.destroy(user.image.public_id);
        }
        
        return successResponse({ res, message: "Welcome User to your account ( Update images )" , 
            data: {
                file: req.file,
                user
            }
        });
    }
);


export const coverImages = errorAsyncHandler(
    async (req , res , next) => {

        const images = [];

        for (const file of req.files){
            const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { folder: `users/${req.user._id}/coverImages`});
            images.push({secure_url , public_id})
        }

        const user = await dbService.findByIdAndUpdate({
            model: userModel,
            id: req.user._id,
            // data: { coverImages: req.files.map(file => file.finalPath)},
            data: { coverImages: images},
            options: {new: true}
        })
        
        return successResponse({ res, message: "Welcome User to your account ( Update profile)" , 
            data: {
                file: req.files,
                user
            }
        });
    }
);

