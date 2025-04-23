import { Router } from 'express';
import * as validators from './user.validation.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as userService from './service/user.service.js'
import * as adminService from './service/admin.service.js'
import { authentication, authorization } from '../../middleware/auth.middleware.js';
import { endPoint } from './user.endpoint.js';
import { fileValidationTypes } from "../../utils/multer/local.multer.js";
import { uploadCloudinaryFile } from "../../utils/multer/cloudinary.multer.js";




const router = Router();

router.get("/viewersContent/:contentId" ,
    validation(validators.viewersContentValidation) ,
    authentication() ,
    authorization(endPoint.users) ,
    userService.viewersContent
);

router.get("/contentAnalytics/:contentId" ,
    validation(validators.viewersContentValidation) ,
    authentication() ,
    authorization(endPoint.users) ,
    userService.contentAnalytics
);

// admin
router.get('/profile/admin/dashboard',authentication() , 
    authorization(endPoint.admin),
    adminService.dashBoardAdmin
);


router.post('/profile/admin/roles',authentication() , 
    authorization(endPoint.admin),
    adminService.changePrivileges
);


// user

// userProfile
router.get('/profile' , 
    authentication() , authorization(endPoint.users) ,
    userService.userProfile
);

// UpdateUserProfile
router.patch('/profile' ,
    validation(validators.updateProfileValidation), 
    authentication(), authorization(endPoint.users) ,  
    userService.UpdateUserProfile
);

// UpdatePassword
router.patch('/profile/password', 
    validation(validators.updatePasswordValidation), 
    authentication(), authorization(endPoint.users), 
    userService.UpdatePassword
);

// Email
router.patch('/profile/email' , 
    validation(validators.updateEmailValidation) ,authentication() , 
    userService.UpdateEmail
);
router.patch('/profile/replace-email' , 
    validation(validators.replaceEmailValidation) ,
    authentication() , userService.replaceEmail
);


// Images
router.patch('/profile/image', 
    authentication() , 
    uploadCloudinaryFile( fileValidationTypes.image).single('image') , 
    userService.updateImages
);

router.patch('/profile/image/cover',authentication() , 
    uploadCloudinaryFile(fileValidationTypes.image).array('image' , 5) , 
    userService.coverImages
);


export default router;
