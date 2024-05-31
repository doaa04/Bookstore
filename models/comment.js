const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const commentSchema = new schema({
    content: {
        type: String,
        required: true
    },
    user: {
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }
}, { timestamps: true });


const Comment = mongoose.model('Message', commentSchema);
module.exports = Comment;