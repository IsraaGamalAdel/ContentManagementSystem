import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({path:(path.resolve('./config/.env.dev'))});

import  bootstrap  from './src/app.controller.js'
import  express  from 'express'
import deleteExpiredOTPs from './src/modules/auth/service/deletingExpiredOTP.service.js';


const app = express()
const PORT = process.env.PORT


bootstrap(app , express);

deleteExpiredOTPs();

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));

app.on('error' , (err) => {
    console.error(`server error ${err}`);
});



