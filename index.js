import path from 'path';
import * as dotenv from 'dotenv';

// dotenv.config({path:(path.resolve('./config/.env.dev'))});
dotenv.config({path:(path.resolve('./config/.env.prod'))});


import  bootstrap  from './src/app.controller.js'
import  express  from 'express'
import deleteExpiredOTPs from './src/modules/auth/service/deletingExpiredOTP.service.js';
import { runIo } from './src/modules/notifications/notifications.socket.controller.js';
import chalk from 'chalk';


const app = express()
const port = process.env.PORT


bootstrap(app , express);

deleteExpiredOTPs();

const httpServer = app.listen(port, () => {
    console.log(chalk.bgBlue(`Example app listening on PORT ${port}!`))
});

// Socket.io
runIo(httpServer);

app.on('error', (err) => {
    console.error(`Error app listening on PORT : ${err}`);
});

