import { userModel } from "../../../DB/model/User.model.js";
import * as dbService from '../../../DB/db.service.js';
import { errorAsyncHandler } from "../../../utils/response/error.response.js";
import { successResponse } from './../../../utils/response/success.response.js';
import { timeCodeOTP } from './../../../middleware/timeCode.middleware.js';
import { generateEncryption } from './../../../utils/security/encryption.security.js';
import { generateHash } from "../../../utils/security/hash.security.js";
import { emailEvent } from './../../../utils/events/sendEmailEvent.js';




export const signup = errorAsyncHandler(
    async (req, res, next) => {
        //confirmPassword not save in DB
        const {userName , email , password ,confirmPassword , phone} = req.body;

        if (password !== confirmPassword ){
            return next(new Error("password and confirmPassword not match" , {cause: 400}))
        }
        
        if(await dbService.findOne({model: userModel ,filter: {email}})){
            return next(new Error("user already exist" , {cause: 409})); 
        }

        // Encrypt phone
        const encryptedPhone = generateEncryption({
            plainText: phone
        });
        
        //Hash Password
        const hashPassword =generateHash({
            plainText: password
        }); //Hash Password

        const user = await dbService.create({
            model: userModel,
            data: {userName , email , password: hashPassword , phone:encryptedPhone}
        });

        emailEvent.emit("sendConfirmEmail" , {id: user._id ,email , password} )

        return successResponse({ res, message: "user created" , status:201 , data: {user:user._id}})
    }
);


//VerifyConfirmEmail to send code 
export const  VerifyConfirmEmail = errorAsyncHandler(
    async (req , res , next) => {
        const {email , code} = req.body;

        const user = await dbService.findOne({model: userModel ,filter: {email}});

        if(!user){
            return next(new Error("Email not found" , {cause: 404}));
        }

        if(user.confirmEmail){
            return next(new Error("Email already confirm" , {cause: 409}));
        }

        try {
            await timeCodeOTP(user, code, 'emailOTP');
        } catch (error) {
            return next(error);
        }

        await dbService.updateOne({
            model: userModel,
            filter: {email} , 
            data: { 
                confirmEmail: Date.now() ,$unset: {emailOTP: 1 , otpExpiresAt: 1, otpBlockedUntil: 1 , otpAttempts: 1}  ,
            }
        })

        return successResponse({ res, message: "Welcome User to your account (confirmEmail)" , status:200 , data: {}});
    }
);


export const sendCodeOTPVerifyConfirmEmail = errorAsyncHandler(
    async (req , res , next) => {
        const {email} = req.body;

        const user = await dbService.findOne({model: userModel ,filter: {email}});
        if (!user) {
            return next(new Error("Email not found", { cause: 404 }));
        }

        if (user.confirmEmail){
            return next(new Error("Email already confirm", { cause: 409 }));
        }

        emailEvent.emit("sendConfirmEmail" , {id: user._id , email} )

        return successResponse({
            res,
            message: "A new OTP has been sent to your email.",
            status: 200,
        });
    }
);
