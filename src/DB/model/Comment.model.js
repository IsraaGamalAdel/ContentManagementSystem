import  mongoose, { model, Schema, Types } from "mongoose";



const commentSchema =  new Schema({
    content :{     
        type: String,
        trim: true, 
        required: function () {
            return this?.images?.length ? false : true;
        },
        minlength: [2 , `userName minimum  2 characters`],
        maxlength: 20000,
    },

    // images
    images:[{secure_url: String , public_id: String}],

    likes : [{type: Types.ObjectId , ref: "User" }],

    tags: [{type: Types.ObjectId , ref: "User"}],

    userId: {type: Types.ObjectId , ref: "User" , required: true},

    contentId: {type: Types.ObjectId , ref: "Content" , required: true},

    commentId: {type: Types.ObjectId , ref: "Comment" },

    deletedBy: {type: Types.ObjectId , ref: "User" },

    deleted: Date ,
    
},{
    timestamps:true,
    toObject: {virtuals: true},
    toJSON: {virtuals: true}

})

commentSchema.virtual('replies' , {
    localField: '_id',
    foreignField: 'commentId',
    ref: 'Comment',
    justOne: false
})

export const commentModel = mongoose.models.Comment || model("Comment" , commentSchema);

