import { Router } from 'express';
import * as validators from './user.validation.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as userService from './service/user.service.js'


const router = Router();

router.get("/" , userService.create);


export default router;
