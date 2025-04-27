import { Router } from 'express';
import { authentication, authorization } from '../../middleware/auth.middleware.js';
import * as notificationService from './service/notifications.service.js';
import * as validators from './notification.validation.js';
import { validation } from "../../middleware/validation.middleware.js";
import { endPoint } from './notifications.endpoint.js';



const router = Router();

router.patch('/:notificationId/read' , 
    validation(validators.notificationValidation) ,
    authentication(), authorization(endPoint.profile),
    notificationService.notificationAsRead
);



export default router;