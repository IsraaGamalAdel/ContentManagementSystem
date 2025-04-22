import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import * as dbService from "../../../DB/db.service.js";
import * as contentTypes from "../types/content.types.js";
import { contentModel } from "../../../DB/model/contentManagement.model.js";




export const contentList = {
    type: contentTypes.contentListResponse , 
    resolve: async (parent , args) =>  {
        const content = await dbService.findAll({model: contentModel })
        return { statusCode: 200 , message: "Success" , data: content};
    }
};



