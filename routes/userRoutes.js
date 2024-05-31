const express = require('express');
const Book = require('../models/book');
const Service = require('../models/service');
const Store = require('../models/store');
const User = require('../models/user');
const Order = require('../models/order');
const Admin = require('../models/order');
const session = require('express-session');
const bcrypt = require("bcrypt")
const mongoose = require('mongoose');
const Message = require('../models/message');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const userRouter = express.Router();

userRouter.use(express.urlencoded({ extended: true }));

// routes 

userRouter.get('/user/home', async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 }).limit(10).exec(); 

        let recommendations = [];

        if (req.session.user) {
            const user = await User.findById(req.session.user._id);

            if (user.searchHistory && user.searchHistory.length > 0) {
                // Obtenir les catégories et auteurs des recherches récentes
                const categories = user.searchHistory
                    .filter(item => item.category)
                    .map(item => item.category);
                const queries = user.searchHistory
                    .filter(item => item.query)
                    .map(item => item.query);

                // Rechercher des livres basés sur les catégories et auteurs recherchés
                if (categories.length > 0) {
                    recommendations = await Book.find({
                        categories: { $in: categories }
                    }).limit(10).exec();
                } else if (queries.length > 0) {
                    recommendations = await Book.find({
                        $or: [
                            { title: { $regex: queries.join('|'), $options: 'i' } },
                            { author: { $regex: queries.join('|'), $options: 'i' } },
                            { series: { $regex: queries.join('|'), $options: 'i' } },
                            { categories: { $regex: queries.join('|'), $options: 'i' } }
                        ]
                    }).limit(10).exec();
                }
            }
        }

        res.render('user/home', { books: books, recommendations: recommendations });

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});




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

userRouter.get('/user/services', (req, res) => {
    Service.find()
    .then(result => {
        res.render('user/services', { services: result });
    })
})

// search results
userRouter.get('/user/search', async (req, res) => {
    try {
        const query = req.query.searchBar;
        const category = req.query.category;

        const searchQuery = { query: query || "", category: category || "", date: new Date() };

        // Enregistrer la recherche dans l'historique de l'utilisateur
        if (req.session.user) {
            const user = await User.findById(req.session.user._id);
            user.searchHistory.push(searchQuery);
            await user.save();
        }

        let searchResults;

        if (category) {
            searchResults = await Book.find({
                categories: { $regex: category, $options: 'i' }
            }).exec();
        } else {
            searchResults = await Book.find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { author: { $regex: query, $options: 'i' } },
                    { series: { $regex: query, $options: 'i' } },
                    { categories: { $regex: query, $options: 'i' } }
                ]
            }).exec();
        }

        res.render('user/searchResults', { searchResults: searchResults });

    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
});


userRouter.get('/user/stores', (req, res) => {
    Store.find()
    .then(result => {
        res.render('user/stores', { stores: result });
    })
})

// authentication

async function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/user/login')
    }
}

userRouter.get('/user/login', (req, res) => {
    res.render('user/login')
})

userRouter.get('/user/signup', (req, res) => {
    res.render('user/signup')
})

userRouter.get("/user/account", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            res.render('user/account', { user: user });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.post('/user/signup', async (req, res) => {
    try {
        const existingUser = await User.findOne({ username: req.body.username });

        if (existingUser) {
            res.send("Username unavailable");
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const newUser = new User({
                username: req.body.username,
                email: req.body.email, 
                password: hashedPassword,
                cin: req.body.cin, 
                phoneNumber: req.body.phoneNumber, 
                address: req.body.address, 
                birthday: req.body.birthday
            });
            await newUser.save();
            res.status(201).redirect('/user/login');
        }

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.post('/user/login', async (req, res) => {
    try {
        const check = await User.findOne({ email: req.body.email });

        if (check) { 
            const isMatch = await bcrypt.compare(req.body.password, check.password);

            if (isMatch) {
                req.session.user = {
                    _id: check._id,
                    username: check.username,
                    password: check.password,
                    email: check.email,
                    cin: check.cin,
                    phoneNumber: check.phoneNumber,
                    address: check.address,
                    birthday: check.birthday,
                    favorites: check.favorites,
                    history: check.history,
                    basket: check.basket,
                    notifications: check.notifications,
                    messages: check.messages
                };
                res.status(201).redirect(`/user/home?username=${check.username}`);
            } else {
                res.send("Incorrect password");
            }
        } else {
            res.send("User not found"); 
        }
    } catch (e) {
        console.error("Error during login:", e);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.get('/user/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.clearCookie('session');
            res.redirect('/user/login');
        }
    });
});

// needs authentication

userRouter.get("/user/favorites", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            const favoriteBooks = await Book.find({
                _id: { $in: user.favorites }
            }).exec();
            res.render('user/favorites', { favorites: favoriteBooks });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.get("/user/history", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            res.render('user/history', { user: user });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.get("/user/basket", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            const basketBooks = await Book.find({
                _id: { $in: user.basket }
            }).exec();
            res.render('user/basket', { basket: basketBooks, stripePublicKey: stripePublicKey });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.post('/user/addToFavorites', async (req, res) => {
    try {
        const userId = req.session.user._id; 
        const { bookId } = req.body;

        if (!userId) {
            console.log("User not authenticated");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.favorites.includes(bookId)) {
            console.log("Book already in favorites");
            return res.status(400).json({ success: false, message: 'Book already in favorites' });
        }

        user.favorites.push(bookId);
        await user.save();

        res.status(200).json({ success: true, message: 'Book added to favorites' });
    } catch (error) {
        console.error('Error adding book to favorites:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

userRouter.post('/user/removeFromFavorites', async (req, res) => {
    const { bookId } = req.body;

    try {
        const user = await User.findByIdAndUpdate(req.session.user._id, { $pull: { favorites: bookId } }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Book removed from favorites' });
    } catch (error) {
        console.error('Error removing book from favorites:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

userRouter.post('/user/addToBasket', async (req, res) => {
    try {
        const userId = req.session.user._id; 
        const { bookId } = req.body;

        if (!userId) {
            console.log("User not authenticated");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.basket.includes(bookId)) {
            console.log("Book already in basket");
            return res.status(400).json({ success: false, message: 'Book already in basket' });
        }

        user.basket.push(bookId);
        await user.save();

        res.status(200).json({ success: true, message: 'Book added to basket' });
    } catch (error) {
        console.error('Error adding book to basket:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

userRouter.post('/user/removeFromBasket', async (req, res) => {
    const { bookId } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.session.user._id,
            { $pull: { basket: { _id: bookId } } },
            { new: true }
        );
        
        console.log(user.basket);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Book removed from basket' });
    } catch (error) {
        console.error('Error removing book from basket:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

//gestion de formulaire message.
userRouter.get('/user/contact', (req, res) => {
    res.render('user/contact');
});

userRouter.post('/user/contact', async (req, res) => {
    try {
        const { subject, name, phoneNumber, message } = req.body;
        
        const newMessage = new Message({
            subject,
            name,
            phoneNumber,
            message,
            date: new Date()
        });
        
        await newMessage.save();
        
        res.redirect('/user/home'); 
    } catch (error) {
        console.error("Error during message submission:", error);
        res.status(500).send("Internal Server Error");
    }
});



userRouter.post('/user/purchase', async (req, res) => {
    try {
        const userId = req.session.user._id; 
        if (!userId) {
            console.log("User not authenticated");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const token = req.body.token;
        const books = req.body.books;

        const orderBooks = books.map(book => ({
            bookId: new mongoose.Types.ObjectId(book.bookId),
            quantity: book.quantity
        }));

        const newOrder = new Order({
            books: orderBooks,
            user: userId
        });

        const savedOrder = await newOrder.save();

        for (const book of orderBooks) {
            const updatedBook = await Book.findByIdAndUpdate(
                book.bookId,
                {
                    $inc: {
                        availableCopies: -book.quantity,
                        sales: book.quantity
                    }
                },
                { new: true }
            );
            console.log(`Updated book: ${updatedBook}`);
        }

        user.basket = [];
        await user.save();

        console.log('Order placed successfully:', savedOrder);
        return res.status(200).json({ success: true, message: 'Order placed successfully', order: savedOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});


// exporting the router
module.exports = userRouter; 