const express = require('express');
const path = require('path');
const fs = require('fs');

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
        .then(book => {
            const oldImageUrl = book.imageUrl;
            fs.unlinkSync(path.join(__dirname, `../public/covers/${oldImageUrl}`));
            res.sendStatus(204); 
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error deleting book');
        });
});

adminRouter.get('/admin/updateBook/:id', (req, res) => {
    const id = req.params.id;
    Book.findById(id)
        .then(result => {
            res.render('admin/updateBook', { book: result, categories: categories })
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error updating book');
        });
})

adminRouter.post('/admin/updateBookData/:id', upload.single("cover"), async (req, res) => {
    try {
        const id = req.params.id;
        const existingBook = await Book.findById(id);
        const oldImageUrl = existingBook.imageUrl;

        if (req.file) {
            fs.unlinkSync(path.join(__dirname, '../public', oldImageUrl));
        }

        const categoriesArray = JSON.parse(req.body.selectedCategories);
        const categories = categoriesArray.length > 0 ? req.body.selectedCategories : existingBook.categories;

        let imageUrl = req.file? req.file.filename : oldImageUrl;
        const updatedBookData = {
            title: req.body.title,
            author: req.body.author,
            description: req.body.description,
            language: req.body.language,
            pages: req.body.pages,
            year: req.body.year,
            edition: req.body.edition,
            series: req.body.series,
            categories: categories,
            price: req.body.price,
            availableCopies: req.body.availableCopies,
            imageUrl: imageUrl
        };
        await Book.findByIdAndUpdate(id, updatedBookData)
        res.redirect('/admin/home');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating book');
    }
})

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