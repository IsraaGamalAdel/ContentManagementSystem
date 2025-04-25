import { roleTypes } from "../../middleware/auth.middleware.js";





export const endPoint = { 
    // createContent: Object.values(roleTypes),
    createContent: [roleTypes.User , roleTypes.Admin , roleTypes.SuperAdmin],
    deleteContent: [roleTypes.User , roleTypes.Admin , roleTypes.SuperAdmin],
    likeContent: [roleTypes.User],
};

