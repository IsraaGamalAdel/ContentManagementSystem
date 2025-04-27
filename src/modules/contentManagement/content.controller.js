import { Router } from 'express';
import * as validators from './content.validation.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as contentService from './service/content.service.js';
import { authentication, authorization } from '../../middleware/auth.middleware.js';
import { endPoint } from './content.endpoint.js';
import { fileValidationTypes } from './../../utils/multer/local.multer.js';
import { uploadCloudinaryFile } from './../../utils/multer/cloudinary.multer.js';
import commentController from '../comment/comment.controller.js';



const router = Router({caseSensitive: true , strict: true});

router.use("/:contentId/comment" , commentController);

router.post("/" ,
    authentication() , authorization(endPoint.createContent) , 
    uploadCloudinaryFile(fileValidationTypes.image).array('images' , 5),
    validation(validators.createContentValidation) ,
    contentService.createContentManagement
);


router.patch("/:contentId" ,
    authentication() , authorization(endPoint.createContent) , 
    uploadCloudinaryFile(fileValidationTypes.image).array('images' , 5),
    validation(validators.updateContentValidation) ,
    contentService.updateContentManagement
);


router.delete('/delete/:contentId' , 
    authentication() , authorization(endPoint.deleteContent) , 
    validation(validators.deleteContentValidation) ,
    contentService.deleteContentManagement
);


router.patch('/restore/:contentId' , 
    authentication() , authorization(endPoint.deleteContent) , 
    validation(validators.deleteContentValidation) ,
    contentService.restoreContent
);


router.get('/get' , authentication() ,
    contentService.getAllContentManagement
);

export default router;
