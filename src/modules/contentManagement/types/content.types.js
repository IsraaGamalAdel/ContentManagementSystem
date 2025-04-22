import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { imageType, userTypes } from "../../user/types/user.types.js";
import * as dbService from "../../../DB/db.service.js";
import { userModel } from "../../../DB/model/User.model.js";




export const contentType = new GraphQLObjectType({
    name: "contentType",
    fields: {
        _id: {type: GraphQLID},
        title: {
            type: GraphQLString,
            resolve: (parent) => parent.type === 'article' ? parent.title : null
        },
        description: {
            type: GraphQLString,
            resolve: (parent) => (parent.type === 'image' || parent.type === 'video') ? parent.description : null
        },
        type: {type: GraphQLString},
        images: {type: new GraphQLList(
            imageType
        )},
        videoLink: {
            type: GraphQLString,
            resolve: (parent) => parent.type === 'video' ? parent.videoLink : null
        },
        views: {type: GraphQLInt},
        likes: {type: new GraphQLList(GraphQLID)},
        tags: {type: new GraphQLList(GraphQLID)},
        // tags: {
        //     type: new GraphQLList(userTypes),
        //     resolve: async (parent) => {
        //         if (!parent.tags || parent.tags.length === 0) return [];
        //         return await dbService.find({
        //             model: userModel,
        //             filter: {
        //                 _id: { $in: parent.tags },
        //                 deleted: false
        //             }
        //         });
        //     }
        // },
        userId: {type: GraphQLID},
        userIdInfo: {
            type: userTypes,
            resolve: async(parent, args) => {
                return await dbService.findOne({
                    model: userModel,
                    filter: {
                        _id: parent.userId, 
                        deleted: false
                    }
                })
            }
        },
        deletedBy: {type: GraphQLID},
        deleted: {type: GraphQLString},
        createdAt: {type: GraphQLString},
        updatedAt: {type: GraphQLString},
    }
})


export const contentList = new GraphQLList( contentType )


export const  contentListResponse = new GraphQLObjectType({
    name: "contentList",
    fields:{
        statusCode: {type: GraphQLInt},
        message: {type: GraphQLString},
        data: {type: contentList}
    }
})


export const likeContentResponse = new GraphQLObjectType({
    name: "likeContentOrUnLikeContent",
    fields: {
        statusCode: {type: GraphQLInt},
        message: {type: GraphQLString},
        data: {type: contentType}
    }
})