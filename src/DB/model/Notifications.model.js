import  mongoose, { model, Schema, Types } from "mongoose";




const notificationsSchema = new Schema({
    type: {
        type: String,
        enum: ['comment', 'contentUpdate', 'like', 'tag', 'reply'],
        required: true
    },

    sender: { 
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    receiver: { 
        type: Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    content: { 
        type: Types.ObjectId, 
        ref: 'Content' 
    },

    comment: { 
        type: Types.ObjectId, 
        ref: 'Comment' 
    },

    isRead: { 
        type: Boolean, 
        default: false 
    },

    metadata: {
        type: Object,
        default: {}
    },

    deletedAt: Date
}, {
    timestamps: true,
});



export const notificationsModel = mongoose.models.Notification || model("Notification" , notificationsSchema);