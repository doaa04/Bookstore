const express = require('express');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');
const Admin = require('../models/admin');
const bcrypt = require("bcrypt")

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

const storeRouter = require('./storeRoutes');
adminRouter.use(storeRouter);

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

// authentication

async function isAuthenticated(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login')
    }
}

adminRouter.get('/admin/login', (req, res) => {
    res.render('admin/login')
})

adminRouter.get("/admin/account", isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin);
        if (admin) {
            res.render('admin/account', { admin: admin });
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

adminRouter.post('/admin/login', async (req, res) => {
    try {
        const check = await Admin.findOne({ email: req.body.email });

        if (check) { 
            const isMatch = await bcrypt.compare(req.body.password, check.password);

            if (isMatch) {
                req.session.admin = {
                    _id: check._id,
                    password: check.password,
                    email: check.email,
                    notifications: check.notifications,
                    messages: check.messages
                };
                res.status(201).render('admin/home');
            } else {
                res.send("Incorrect password");
            }
        } else {
            res.send("Admin not found"); 
        }
    } catch (e) {
        console.error("Error during login:", e);
        res.status(500).send("Internal Server Error");
    }
});

adminRouter.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.clearCookie('session');
            res.redirect('/admin/login');
        }
    });
});

// exporting the router
module.exports = adminRouter; 