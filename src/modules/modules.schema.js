import { GraphQLObjectType, GraphQLSchema } from "graphql";
import * as contentQueryResolve  from "./contentManagement/resolve/query.resolve.js";
import * as contentMutationResolve  from "./contentManagement/resolve/mutation.resolve.js";
import * as userQueryResolve  from "./user/resolver/user.query.resolver.js";




export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'querySchema',
        description: "Query Schema All Project Modules",
        fields: {
            ...contentQueryResolve,
            ...userQueryResolve
        }
    }),


    mutation: new GraphQLObjectType({
        name: 'mutationSchema',
        description: "Mutation Schema All Project Modules",
        fields: {
            ...contentMutationResolve
        }
    }),
})