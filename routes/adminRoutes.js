const express = require('express');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');


// creation of a userRouter instance
const adminRouter = express.Router();

// middleware to parse from data
adminRouter.use(express.urlencoded({ extended: true }));

// routes 
adminRouter.get('/admin/dashboard', (req, res) => {
    res.render('admin/dashboard');
})

adminRouter.get('/admin/home', (req, res) => {
    Book.find()
    .then((result) => {
        res.render('admin/home' , { books: result });
    })
    .catch((err) => {
        console.log(err);
    })
})

const bookRoutes = require('./bookRoutes');
adminRouter.use(bookRoutes);

const serviceRoutes = require('./serviceRoutes');
adminRouter.use(serviceRoutes);

// search results
adminRouter.get('/admin/search', (req,res) => {
    try {

        const query = req.query.searchBar;
        var searchResults;
        
        if (req.query.category) {
            searchResults = Book.find({
                 categories: { $regex: req.query.category, $options: 'i' }
            })
            .exec()
            .then(searchResults => {
                res.render('admin/searchResults', { searchResults: searchResults });
            });
        }

        else {
            searchResults = Book.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { author: { $regex: query, $options: 'i' } },
                    { series: { $regex: query, $options: 'i' } },
                    { categories: { $regex: query, $options: 'i' } }
                ]
            })
            .exec()
            .then(searchResults => {
                res.render('admin/searchResults', { searchResults: searchResults });
            });
        }
    
    } catch (err) {
        console.log(err);
    }
})

// exporting the router
module.exports = adminRouter; 