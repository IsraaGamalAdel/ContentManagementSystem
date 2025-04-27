import joi from 'joi';
import { generalFields } from "../../middleware/validation.middleware.js";



// export const createContentValidation = joi.object({
//     type: joi.string().valid("article", "image", "video").required(),
//     title: joi.string().min(2).max(20000).trim().when('type', {
//         is: 'article',
//         then: joi.required()
//     }),
//     description: joi.string().min(2).max(20000).trim().when('type', {
//         is: joi.valid('image', 'video'),
//         then: joi.required()
//     }),
//     videoLink: joi.string().when('type', {
//         is: 'video',
//         then: joi.string().pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/).required()
//     }),
//     file: joi.array().items(generalFields.files).max(2).when('type', {
//         is: 'image',
//         then: joi.required(),
//         otherwise: joi.forbidden()
//     })
// }).or("title", "description", "videoLink");


export const createContentValidation = joi.object({
    type: joi.string().valid("article", "image", "video").required(),
    
    title: joi.string().min(2).max(20000).trim().when('type', {
        is: 'article',
        then: joi.required(),
        otherwise: joi.optional()
    }),
    
    description: joi.string().min(2).max(20000).trim().when('type', {
        is: joi.valid('image', 'video'),
        then: joi.required(),
        otherwise: joi.optional()
    }),
    
    videoLink: joi.string().pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/).when('type', {
        is: 'video',
        then: joi.required(),
        otherwise: joi.forbidden()
    }),
    
    file: joi.array().items(generalFields.files).max(5).when('type', {
        is: 'image',
        then: joi.required(),
        otherwise: joi.forbidden()
    }),

    tags: joi.alternatives().try(
        joi.array().items(generalFields.idContent),
        joi.string().min(1).max(50),
    )
}).or("title", "description", "videoLink" , "file");



export const updateContentValidation = joi.object({
    contentId: generalFields.id.required(),
    type: joi.string().valid("article", "image", "video").required(),
    
    title: joi.string().min(2).max(20000).trim().when('type', {
        is: 'article',
        then: joi.required(),
        otherwise: joi.optional()
    }),
    
    description: joi.string().min(2).max(20000).trim().when('type', {
        is: joi.valid('image', 'video'),
        then: joi.required(),
        otherwise: joi.optional()
    }),
    
    videoLink: joi.string().pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/).when('type', {
        is: 'video',
        then: joi.required(),
        otherwise: joi.forbidden()
    }),
    
    file: joi.array().items(generalFields.files).max(5).when('type', {
        is: 'image',
        then: joi.required(),
        otherwise: joi.forbidden()
    })
}).or("title", "description", "videoLink" , "file");


export const deleteContentValidation = joi.object({
    contentId: generalFields.id.required(),
});


export const likeContentQraphQLValidation = joi.object().keys({
    contentId: generalFields.id.required(),
    action: joi.string().valid('like' , 'unlike').default('like'),
    token: joi.string().required(),
}).required();

