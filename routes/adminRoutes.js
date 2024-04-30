const express = require('express');
const path = require('path');

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

adminRouter.get('/admin/book/:id', (req, res) => {
    const id = req.params.id;
    Book.findById(id)
    .then(result => {
        res.render('admin/book',{ book: result })
    })
    .catch(err => {
        console.log(err);
    })
})

const categories = [
    'Fiction', 
    'Non-Fiction', 
    'Mystery', 
    'Fantasy', 
    'Science Fiction', 
    'Romance', 
    'Drama', 
    'History',
    'Programming',
    'Mathematics',
    'Physics',
    'Music',
    'Art',
    'Cooking'];
adminRouter.get('/admin/addBook', (req, res) => {
    res.render('admin/addBook', { categories: categories });
})

// Middleware for handling file uploads and creation of an instance of it
const multer = require('multer');
const Book = require('../models/book');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = path.join(__dirname, '../public/covers');
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

// accessing data from form and saving it into db
adminRouter.post('/admin/addBook', upload.single("cover"), (req, res) => {
    const coverFileName = req.file.filename;
    const imageUrl = `/covers/${coverFileName}`;
    const newBook = new Book({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        language: req.body.language,
        pages: req.body.pages,
        year: req.body.year,
        edition: req.body.edition,
        series: req.body.series,
        categories: req.body.selectedCategories,
        price: req.body.price,
        availableCopies: req.body.availableCopies,
        imageUrl: coverFileName
    });
    newBook.save()
        .then(book => {
            res.redirect('/admin/addBook');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error adding book');
        });
})

// handler for delete request
adminRouter.delete('/admin/home/:id', (req, res) => {
    const id = req.params.id;
    Book.findByIdAndDelete(id)
        .then(() => {
            res.sendStatus(204); 
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error deleting book');
        });
});

// exporting the router
module.exports = adminRouter; 