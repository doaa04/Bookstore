const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const serviceSchema = new schema({
    title: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: false
    }
}, { timestamps: true });


const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;