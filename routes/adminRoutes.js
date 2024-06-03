const express = require('express');
const path = require('path');
const fs = require('fs');

const Book = require('../models/book');
const Order = require('../models/order');
const Admin = require('../models/admin');
const bcrypt = require("bcrypt")
const Message = require('../models/message');
const adminController = require('../controllers/adminController');  

const adminRouter = express.Router();

// middleware to parse from data
adminRouter.use(express.urlencoded({ extended: true }));

// routes 

const bookRoutes = require('./bookRoutes');
adminRouter.use(bookRoutes);

const serviceRoutes = require('./serviceRoutes');
adminRouter.use(serviceRoutes);

const storeRouter = require('./storeRoutes');
adminRouter.use(storeRouter);

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

// search results
adminRouter.get('/admin/search', isAuthenticated, (req,res) => {
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

adminRouter.get('/admin/home', isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin);
        Book.find()
            .then((result) => {
                console.log('Books fetched:', result);
                res.render('admin/home' , { books: result });
            })
            .catch((err) => {
                console.error('Error fetching books:', err);
                console.log(err);
            })
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
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

adminRouter.get("/admin/orders", isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findOne();

        if (!admin) {
            console.log("Admin not found");
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const orders = await Order.find({ _id: { $nin: admin.delivered } })
        .populate({
            path: 'books.bookId',
            model: 'Book'
        })
        .populate('user', 'name email');

        const ordersCount = await Order.countDocuments({ _id: { $nin: admin.delivered } });

        res.render('admin/orders', { orders: orders, ordersCount: ordersCount });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

adminRouter.post("/admin/login", async (req, res) => {
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
            messages: check.messages,
          };
          Book.find()
            .then((result) => {
              res.render("admin/home", { books: result });
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
            return res.render('admin/login', { error: "Incorrect password" });
        }
      } else {
        return res.render('admin/login', { error: "Admin not found" });
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

adminRouter.get('/admin/messaging', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message.find().sort({ date: -1 });
        res.render('admin/messaging', { messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send("Internal Server Error");
    }
});

adminRouter.post('/admin/messages/:id/delete', isAuthenticated, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.redirect('/admin/messaging'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

adminRouter.post('/admin/deleteOrder', async (req, res) => {
    const { orderId } = req.body;

    try {
        const admin = await Admin.findByIdAndUpdate(
            req.session.admin._id,
            { $addToSet: { delivered: orderId } },
            { new: true }
        );
        
        console.log(admin.delivered);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        return res.status(200).json({ success: true, message: 'Order removed' });
    } catch (error) {
        console.error('Error removing order:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

adminRouter.get("/admin/dashboard", isAuthenticated, async (req, res) => {
    try {
        if (!req.session.admin) {
            res.redirect('/admin/login');    
        } else {
            res.render('admin/dashboard')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

adminRouter.get('/admin/adminData', (req, res) => {
    Admin.findOne({ _id: req.session.admin._id })
        .populate('notifications') 
        .then(admin => {
            if (!admin) {
                return res.status(404).json({ message: 'Admin not found' });
            }
            res.status(200).json({ notifications: admin.notifications });
        })
        .catch(err => {
            console.error('Error finding admin:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

adminRouter.post('/admin/deleteNotification', async (req, res) => {
    const { notificationId } = req.body;

    try {
        const admin = await Admin.findOneAndUpdate(
            { _id: req.session.admin._id },
            { $pull: { notifications: notificationId } },
            { new: true }
        );
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        return res.status(200).json({ success: true, message: 'Notification removed' });
    } catch (error) {
        console.error('Error removing notification:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

adminRouter.get("/admin/settings", isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin);
        if (admin) {
            res.render('admin/settings', { admin: admin });
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//dash 
adminRouter.get('/stats', async (req, res) => {
    try {
        const stats = await adminController.getAdminStats(req, res);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
adminRouter.get('/admin/stats', isAuthenticated, adminController.getAdminStats);

adminRouter.post('/admin/updateProfile', isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin._id);

        if (!admin) {
            return res.status(404).render('admin/settings', { error: 'Admin not found' });
        }

        const { email, currentPassword, newPassword, confirmPassword } = req.body;

        // Check if current password matches
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).render('admin/settings', { error: 'Incorrect current password', admin: admin });
        }

        // Update admin details
        admin.email = email;

        // Update password if new password is provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                return res.status(400).render('admin/settings', { error: 'New passwords do not match', admin: admin });
            }
            admin.password = await bcrypt.hash(newPassword, 10);
        }

        await admin.save();
        res.render('admin/settings', { success: 'Profile updated successfully', admin: admin });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).render('admin/settings', { error: 'Internal Server Error', admin: req.session.admin });
    }
});

// exporting the router
module.exports = adminRouter; 