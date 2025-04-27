import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
// DB
import * as dbService from "../../../DB/db.service.js";
import { contentModel } from "../../../DB/model/ContentManagement.model.js";
// utils
import { authentication, authorization } from "../../../middleware/auth.graphQL.middleware.js";
import { roleTypes } from "../../../middleware/auth.middleware.js";
// content
import * as contentTypes from "../types/content.types.js";
// validation middleware
import { validationGraphQL } from "../../../middleware/validation.middleware.js";
import { likeContentQraphQLValidation } from "../content.validation.js";




export const likeContent = {
    type: contentTypes.likeContentResponse,
    
    args: {
        contentId: {type: new GraphQLNonNull( GraphQLID )},
        token: {type: new GraphQLNonNull( GraphQLString )},
        action: {type: new GraphQLNonNull(
            new GraphQLEnumType({
                name: "likeActionTypes",
                values: {
                    like: {value: 'like'},
                    unLike: {value: 'unLike'},
                }
            })
        )}
    },
    resolve: async(parent , args) => {
        const {contentId , token , action} = args;

        await validationGraphQL({scheme: likeContentQraphQLValidation , args});

        // authentication
        const user = await authentication({authorization: token});
        await authorization({ role: user.role , accessRoles: [roleTypes.User] });

        const data = action === 'unLike' ? {$pull: {likes: user._id}} : {$addToSet: {likes: user._id}};
        
        const content = await dbService.findOneAndUpdate({
            model: contentModel,
            filter: {
                _id: contentId , 
                deleted: {$exists: false},
            },
            data: data,
            options: {
                new: true
            }
        })

        if(!content){
            throw new Error("Content not found" , {cause: 404});
        }

        return {
            statusCode: 200,
            message: "Success",
            data: content 
        }
    }
}
