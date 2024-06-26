const mongoose = require('mongoose');
const { type } = require('os');
const internal = require('stream');
const schema = mongoose.Schema; 

// schema creation
const bookSchema = new schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String, 
        required: true
    },
    description: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    pages: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    edition: {
        type: String,
        required: false
    },
    series: {
        type: String,
        required: false
    },
    categories: {
        type: String,
        required: false
    },
    price: {
        type: String,
        required: true
    },
    availableCopies: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    sales: {
        type: Number,
        default: 0
    },
    comments: [{ type: schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true });


// creating model based on schema
const Book = mongoose.model('Book', bookSchema);


// explorting model
module.exports = Book;