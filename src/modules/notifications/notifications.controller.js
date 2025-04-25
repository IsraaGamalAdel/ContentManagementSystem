import { Router } from 'express';
import { authentication, authorization } from '../../middleware/auth.middleware.js';
// import * as chatService from './service/notifications.service.js';
import { validation } from "../../middleware/validation.middleware.js";
import { endPoint } from './notifications.endpoint.js';

// import * as validators from './user.validation.js';


const router = Router();

router.get('/:destId' , 
    authentication(),
    authorization(endPoint.profile),
    // chatService.notification
);



export default router;