import  mongoose, { model, Schema, Types } from "mongoose";


export const types = {
    article: "article",
    image: "image",
    video: "video"
};


export const viewersStatus = {
    Mobile: "Mobile",
    Desktop: "Desktop"
}


const contentSchema = new Schema({

    title: {     
        type: String,
        trim: true, 
        required: function () {
            return this.type === 'article';
        },
        minlength: [2 , `title must be minimum  2 characters`],
        maxlength: 20000,
    },

    description: {     
        type: String,
        trim: true, 
        required: function() {
            return this.type === 'image' || this.type === 'video';
        },
        minlength: [2 , `description must be minimum  2 characters`],
        maxlength: 50000,
    },

    type: {
        type: String,
        enum: Object.values(types),
        required: true,
    },
    
    videoLink: {
        type: String,
        required: function() {
            return this.type === "video";
        },
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+/.test(v);
            },
            message: props => `${props.value} is not a valid video link!`
        }
    },

    likes : [{type: Types.ObjectId , ref: "User" }],

    tags: [{type: Types.ObjectId , ref: "User"}],

    images:[{secure_url: String , public_id: String}],

    userId: {type: Types.ObjectId , ref: "User" , required: true},

    viewers: [{
        userId: { type: Types.ObjectId, ref: "User" },
        time: Date,
        deviceType: { type: String, enum: [viewersStatus.Mobile , viewersStatus.Desktop] },
        sessionStart: Date,
        sessionEnd: Date,
        duration: Number // in seconds date
    }],
    
    viewCount: { type: Number, default: 0 },

    deletedBy: {type: Types.ObjectId , ref: "User" },
    createdAt: {type: Date , default: Date.now},

    deleted: Date ,

} , {
    timestamps: true,
    toObject:{ virtuals: true},
    toJSON: {
        virtuals: true
    }
});


contentSchema.virtual('comments' , {
    localField: '_id',
    foreignField: 'contentId',
    ref: 'Comment',
    justOne: true
})



export const contentModel = mongoose.models.Content || model("Content" , contentSchema);


