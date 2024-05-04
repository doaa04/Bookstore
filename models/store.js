const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const storeSchema = new schema({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    opening: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    }
}, { timestamps: true });


const Store = mongoose.model('Store', storeSchema);
module.exports = Store;