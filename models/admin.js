const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const adminSchema = new schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    notifications: [{ type: schema.Types.ObjectId, ref: 'Notification' }],
    messages: [{ type: schema.Types.ObjectId, ref: 'Message' }]
}, { timestamps: true });


const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;