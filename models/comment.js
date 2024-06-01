const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const commentSchema = new schema({
    content: {
        type: String,
    },
    user: {
        type: schema.Types.ObjectId,
        ref: 'User',
    },
    book: {
        type: schema.Types.ObjectId,
        ref: 'Book',
    },
    likes: {
        type: Number,
        default: 0
    }
}, { timestamps: true });


const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;