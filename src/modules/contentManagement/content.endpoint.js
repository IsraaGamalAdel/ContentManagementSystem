import { roleTypes } from "../../middleware/auth.middleware.js";





export const endPoint = { 
    createContent: Object.values(roleTypes),
    likeContent: [roleTypes.User],
    deleteContent: [roleTypes.User , roleTypes.Admin]
};

