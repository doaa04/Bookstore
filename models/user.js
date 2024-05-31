const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const userSchema = new schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email: {
        type: String,
        required: true
    },
    cin: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    birthday: {
        type: Date,
        required: true
    },
    favorites: [{ type: schema.Types.ObjectId, ref: 'Book' }],
    history: [{ type: schema.Types.ObjectId, ref: 'Order' }],
    basket: [{ 
        bookId: { type: schema.Types.ObjectId, ref: 'Book' }, 
        quantity: { type: Number, default: 1 } 
    }],
    notifications: [{ type: schema.Types.ObjectId, ref: 'Notification' }],
    searchHistory: {
        type: [{ query: String, category: String, date: Date }],
        default: []
    },
    messages: [{ type: schema.Types.ObjectId, ref: 'Message' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;