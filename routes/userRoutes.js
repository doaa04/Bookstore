const express = require('express');
const Book = require('../models/book');

// creation of a userRouter instance
const userRouter = express.Router();

// routes 

userRouter.get('/', (req, res) => {
    res.redirect('/user/home');
})

userRouter.get('/user/home', (req, res) => {
    Book.find()
    .then((result) => {
        res.render('user/home' , { books: result });
    })
    .catch((err) => {
        console.log(err);
    })
})

userRouter.get('/user/book/:id', (req, res) => {
    const id = req.params.id;
    Book.findById(id)
    .then(result => {
        res.render('user/book',{ book: result })
    })
    .catch(err => {
        console.log(err);
    })
})

// search results
userRouter.get('/user/search', (req,res) => {
    const query = req.query.searchBar;
    const searchResults = Book.find({
        $or: [
            { title: { $regex: query, $options: 'i' } }, 
            { author: { $regex: query, $options: 'i' } }, 
            { series: { $regex: query, $options: 'i' } }, 
            { categories: { $regex: query, $options: 'i' } }
        ]
    })
    .exec()
    .then(searchResults => {
        res.render('user/searchResults', { searchResults: searchResults }); 
    })
    .catch(err => console.log(err));
})

// exporting the router
module.exports = userRouter; 