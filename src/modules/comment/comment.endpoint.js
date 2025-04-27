import { roleTypes } from "../../middleware/auth.middleware.js";





export const endPoint = { 
    create: [roleTypes.User , roleTypes.Admin , roleTypes.SuperAdmin],
    freeze: [roleTypes.User , roleTypes.Admin , roleTypes.SuperAdmin],
    like: [roleTypes.User],
};

