const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const messageSchema = new schema({
    object: {
        type: String,
        required: false
    },
    body: {
        type: String,
        required: true
    }
}, { timestamps: true });


const Message = mongoose.model('Message', messageSchema);
module.exports = Message;