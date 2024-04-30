const express = require('express');

// creation of a userRouter instance
const userRouter = express.Router();

// routes 

userRouter.get('/', (req, res) => {
    res.redirect('/user/home');
})

const Book = require('../models/book');
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

// exporting the router
module.exports = userRouter; 