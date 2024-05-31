const express = require('express');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');

const bookRouter = express.Router();

async function isAuthenticated(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login')
    }
}

bookRouter.get('/admin/book/:id', (req, res) => {
    const id = req.params.id;
    Book.findById(id)
        .then(result => {
            res.render('admin/book', { book: result })
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
bookRouter.get('/admin/addBook', isAuthenticated, (req, res) => {
    res.render('admin/addBook', { categories: categories });
})

const multer = require('multer');
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

bookRouter.post('/admin/addBook', upload.single("cover"), (req, res) => {
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

bookRouter.delete('/admin/home/:id', (req, res) => {
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

bookRouter.get('/admin/updateBook/:id', (req, res) => {
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

bookRouter.post('/admin/updateBookData/:id', upload.single("cover"), async (req, res) => {
    try {
        const id = req.params.id;
        const existingBook = await Book.findById(id);
        const oldImageUrl = existingBook.imageUrl;

        if (req.file) {
            fs.unlinkSync(path.join(__dirname, '../public', oldImageUrl));
        }

        const categoriesArray = JSON.parse(req.body.selectedCategories);
        const categories = categoriesArray.length > 0 ? req.body.selectedCategories : existingBook.categories;

        let imageUrl = req.file ? req.file.filename : oldImageUrl;
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

module.exports = bookRouter; 