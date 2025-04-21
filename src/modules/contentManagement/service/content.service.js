import * as dbService from '../../../DB/db.service.js';
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import cloudinary from './../../../utils/multer/cloudinary.js';
import { contentModel } from "../../../DB/model/contentManagement.model.js";
import { successResponse } from './../../../utils/response/success.response.js';



const populateList = [
    {path: 'userId' , select: "userName email image" },
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
    {path: 'likes' , select: "userName email image" },
    {path: 'share' , select: "userName email image" },
    {path: 'tags' , select: "userName email image"  }
];



export const createContentManagement = errorAsyncHandler(
    async (req , res ,next) => {
        if(req.files){

            const images = [];
            for (const file of req.files) {
                const {secure_url , public_id} = await cloudinary.uploader.upload(file.path , { 
                    folder: `${process.env.APP_NAME}/user/${req.user._id}/content`
                })
                images.push({secure_url , public_id});
            }
            req.body.images = images
        }

        const contentManagement = await dbService.create({
            model: contentModel,
            data: {
                ...req.body,
                userId: req.user._id,
            }
        })

        return successResponse({
            res,
            message: "Welcome User to your account ( Create contentManagement)",
            status: 201,
            data: {contentManagement}
        })
    }
);



export const updateContentManagement = errorAsyncHandler(
    async (req , res , next) => {

    }
);