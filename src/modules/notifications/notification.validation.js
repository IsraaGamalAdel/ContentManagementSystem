import joi from 'joi';
import { generalFields } from '../../middleware/validation.middleware.js';



export const notificationValidation = joi.object().keys({
    notificationId: generalFields.id.required(),
}).required();

