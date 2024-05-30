const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    subject: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
