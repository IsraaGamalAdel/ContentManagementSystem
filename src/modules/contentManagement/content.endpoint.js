import { roleTypes } from "../../middleware/auth.middleware.js";





export const endPoint = { 
    createPost: Object.values(roleTypes),
    likePost: [roleTypes.User],
    freezePost: [roleTypes.User , roleTypes.Admin]
};

