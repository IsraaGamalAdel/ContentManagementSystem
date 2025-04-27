import path from 'node:path';
// DB Or Error
import connectDB from './DB/connection.js';
import { globalErrorHandling } from './utils/response/error.response.js';
// controllers
import authController from './modules/auth/auth.controller.js';
import contentController from './modules/contentManagement/content.controller.js';
import userController from './modules/user/user.controller.js';
import notificationController from './modules/notifications/notifications.controller.js';

import cors from 'cors'; // upload Deployment 
import helmet from 'helmet';
import morgan from 'morgan';
// graphql
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './modules/modules.schema.js';
import rateLimit from 'express-rate-limit';




const limiter = rateLimit({
    limit: 5,
    windowMs: 3 * 60 * 1000,
    message: {
        error: "Rate limit exceeded"
    },
    skipFailedRequests: true
});


// API
const url = '/api/v1'

const bootstrap = (app, express) => {

    app.use(express.json());

    app.use(morgan('dev')); // development
    app.use(helmet());

    app.use(cors({
        origin: '*'
    }));

    app.use(limiter);

    app.use('/uploads' , express.static(path.resolve('./src/uploads')));


    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Welcome in node.js project powered by express and ES6" })
    })

    app.use('/graphql' , createHandler({schema}));
    app.use(`${url}/auth`, authController);
    app.use(`${url}/content` , contentController)
    app.use(`${url}/user`, userController);
    app.use(`${url}/notification`, notificationController);


    app.use(globalErrorHandling);

    app.all("*", (req, res, next) => {
        return res.status(404).json({ message: "In-valid routing" })
    })

    //mongoose
    connectDB();

}

export default bootstrap