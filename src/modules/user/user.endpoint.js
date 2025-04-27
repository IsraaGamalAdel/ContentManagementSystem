import { roleTypes } from "../../middleware/auth.middleware.js";




export const endPoint = { 
    users: Object.values(roleTypes),

    admin: [roleTypes.Admin , roleTypes.SuperAdmin] ,
};

