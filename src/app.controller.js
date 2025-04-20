import path from 'node:path';
// DB Or Error
import connectDB from './DB/connection.js';
import { globalErrorHandling } from './utils/response/error.response.js';
// controllers
import authController from './modules/auth/auth.controller.js';

import cors from 'cors'; // upload Deployment 
import helmet from 'helmet';
import morgan from 'morgan';



// API
const url = '/api/v1'

const bootstrap = (app, express) => {

    app.use(express.json());

    app.use(morgan('dev')); // development
    app.use(helmet());

    app.use(cors({
        origin: '*'
    }));

    app.use('/uploads' , express.static(path.resolve('./src/uploads')));

    // app.all(`*`, (req, res, next) => {
    //     console.log(
    //     `
    //         User with ip: ${req.ip} send request with:
    //         URL: ${req.url}
    //         method: ${req.method}
    //         body: ${JSON.stringify(req.body)}
    //         Headers:${JSON.stringify(req.headers['en'])}
    //     `
    //     );
    //     next();
    // });

    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Welcome in node.js project powered by express and ES6" })
    })
    app.use(`${url}/auth`, authController);


    app.use(globalErrorHandling);

    app.all("*", (req, res, next) => {
        return res.status(404).json({ message: "In-valid routing" })
    })

    //mongoose
    connectDB();

}

export default bootstrap