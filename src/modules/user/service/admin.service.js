import * as dbService from "../../../DB/db.service.js";
import { contentModel } from "../../../DB/model/contentManagement.model.js";
import { userModel } from "../../../DB/model/User.model.js";
import { roleTypes } from "../../../middleware/auth.middleware.js";
import { decodeEncryption } from "../../../utils/security/encryption.security.js";



// Admin
export const dashBoardAdmin = errorAsyncHandler(
    async (req , res , next) => {

        const data = await Promise.allSettled([
            dbService.findAll({
                model: userModel,
                filter: {}
            }),
            dbService.findAll({
                model: contentModel,
                filter: {}
            })
        ])

        return successResponse({ res, message: "get all users and contents" , 
            data: {
                data
            }
        });
    }
);


export const changePrivileges = errorAsyncHandler(
    async (req, res, next) => {
        const { userId, role } = req.body;

        const owner = req.user.role === roleTypes.SuperAdmin ? {} : {
            role: {
                $nin: [roleTypes.Admin, roleTypes.SuperAdmin]
            }
        };

        if (req.user.role === roleTypes.SuperAdmin && role === roleTypes.SuperAdmin) {
            return next(new Error("SuperAdmin can not change role to SuperAdmin", { cause: 400 }));
        }

        const user = await dbService.findOne({
            model: userModel,
            filter: {
                _id: userId,
                deleted: { $exists: false },
                ...owner
            }
        });

        if (!user) {
            return next(new Error("Invalid account user Id not found", { cause: 404 }));
        }

        if (user.role === role) {
            return next(new Error(`User already has the role: ${role}`, { cause: 400 }));
        }

        const decryptedPhone = decodeEncryption({ cipherText: user.phone });

        const updatedUser = await dbService.findOneAndUpdate({
            model: userModel,
            filter: {
                _id: userId,
                deleted: { $exists: false },
                ...owner
            },
            data: {
                role,
                updatedBy: req.user._id
            },
            options: { new: true }
        });

        return successResponse({
            res,
            message: "User role updated successfully",
            data: {
                user: {
                    ...updatedUser.toObject(),
                    phone: decryptedPhone
                }
            }
        });
    }
);
