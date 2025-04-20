import { userModel } from "../../../DB/model/User.model.js";



export const signup = async (req, res, next) => {
    try{
        const {userName , email , password} = req.body;
        const checkUsers = await userModel.findOne({email});
        if(checkUsers){
            return res.status(400).json({message:"user already exist"})
        }
        const user = new UserModel({userName , email , password});
        await user.save();
        return res.status(201).json({message:"user created" , user});

    }catch(err){
        return res.status(500).json({err , message:"error server" , msg:err.message , stack:err.stack})
    }
}

