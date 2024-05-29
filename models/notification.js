const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const notificationSchema = new schema({
    object: {
        type: String,
        required: false
    },
    body: {
        type: String,
        required: true
    }
}, { timestamps: true });


const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;