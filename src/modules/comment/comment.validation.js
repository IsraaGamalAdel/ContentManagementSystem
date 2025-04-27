import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';


export const createCommentValidation = joi.object().keys({
    contentId: generalFields.id.required(),
    commentId: generalFields.id,
    content: joi.string().min(2).max(20000).trim(),
    file: joi.array().items(generalFields.files).max(2),
    tags: joi.alternatives().try(
        joi.array().items(generalFields.idContent),
        joi.string().min(1).max(50),
    )
}).or('content' , 'file');


export const updateCommentValidation = joi.object().keys({
    contentId: generalFields.id.required(),
    commentId: generalFields.id.required(),
    content: joi.string().min(2).max(20000).trim(),
    file: joi.array().items(generalFields.files).max(2),
    tags: joi.alternatives().try(
        joi.array().items(generalFields.idContent),
        joi.string().min(1).max(50),
    )
}).or('content' , 'file');



export const freezeCommentValidation = joi.object().keys({
    contentId: generalFields.id.required(),
    commentId: generalFields.id.required(),
}).required();


export const likeCommentValidation = joi.object().keys({
    commentId: generalFields.id.required(),
    action: joi.string().valid('like' , 'unlike').default('like'),
}).required();



