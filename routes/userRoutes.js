const express = require('express');
const Book = require('../models/book');
const Service = require('../models/service');
const Store = require('../models/store');
const User = require('../models/user');
const Order = require('../models/order');
const Admin = require('../models/admin');
const Comment = require('../models/comment');
const Notification = require('../models/notification');
const session = require('express-session');
const bcrypt = require("bcrypt")
const mongoose = require('mongoose');
const Message = require('../models/message');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const userRouter = express.Router();

userRouter.use(express.urlencoded({ extended: true }));

// routes 

userRouter.get('/', (req, res) => {
    res.redirect('/user/home')
})

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




userRouter.get('/user/book/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const book = await Book.findById(bookId).populate({
            path: 'comments',
            populate: {
                path: 'user', 
                model: 'User' 
            }
        });
        if (!book) {
            res.status(404).send('Book not found');
        }
        res.render('user/book', { book: book });
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).send('Error fetching book details');
    }
})

userRouter.post('/book/:bookId/comment', async (req, res) => {
    try {
        const { content } = req.body;
        const user = req.session.user._id;
        const bookId = req.params.bookId;
        
        if (!content) {
            res.status(400).send('Content ');
        }

        if (!user) {
            res.status(400).send('User');
        }
        
        const newComment = new Comment({
            content,
            user,
            book: bookId
        });
        await newComment.save();

        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).send('Book not found');
        }
        book.comments.push(newComment._id);
        await book.save();

        res.redirect(`/user/book/${bookId}`);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send('Error adding comment');
    }
});

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
                return res.render('user/login', { error: "Incorrect password" });
            }
        } else {
            return res.render('user/login', { error: "User not found" });
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
            const history = await Order.find({ user: req.session.user._id })
            .populate({
                path: 'books.bookId',
                model: 'Book'
            })
            .populate('user', 'name email');
            res.render('user/history', { user: user, orders: history });
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
        const { bookId } = req.body;

        if (!req.session.user) {
            console.log("User not authenticated");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.session.user._id; 
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
        const { bookId } = req.body;

        if (!req.session.user) {
            console.log("User not authenticated");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.session.user._id; 
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

userRouter.get("/user/contact", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            res.render('user/contact', { user: user });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
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

userRouter.get("/user/notifications", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            res.render('user/notifications', { user: user });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

userRouter.get("/user/settings", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (user) {
            res.render('user/settings', { user: user });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error(error);
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
        user.history.push(savedOrder);
        await user.save();

        const notification = new Notification({
            object: `New Order Placed`,
            body: `User ${user.username} has placed a new order with ID ${savedOrder._id}.`
        });
        await notification.save();
    
        const admins = await Admin.find();
        const adminUpdates = admins.map(admin =>
            Admin.findByIdAndUpdate(
                admin._id,
                { $push: { notifications: notification._id } }
            )
        );

        await Promise.all(adminUpdates);

        console.log('Order placed successfully:', savedOrder);
        return res.status(200).json({ success: true, message: 'Order placed successfully', order: savedOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

userRouter.get('/user/userData', (req, res) => {
    User.findOne({ _id: req.session.user._id })
        .populate('notifications') 
        .then(user => {
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ notifications: user.notifications });
        })
        .catch(err => {
            console.error('Error finding user:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

userRouter.post('/user/deleteNotification', async (req, res) => {
    const { notificationId } = req.body;

    try {
        const user = await User.findOneAndUpdate(
            { _id: req.session.user._id },
            { $pull: { notifications: notificationId } },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification removed' });
    } catch (error) {
        console.error('Error removing notification:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});


// exporting the router
module.exports = userRouter; 