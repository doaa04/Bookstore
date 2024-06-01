const Book = require('../models/book');
const User = require('../models/user');
const Order = require('../models/order');

exports.getAdminStats = async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const outOfStockBooks = await Book.countDocuments({ availableCopies: { $lte: 0 } });

        const topBooks = await Book.find().sort({ sales: -1 }).limit(5).select('title sales');

        const categoryStats = await Book.aggregate([
            { $unwind: "$categories" },
            { $group: { _id: "$categories", count: { $sum: 1 } } }
        ]);

        res.json({
            totalBooks,
            totalUsers,
            totalOrders,
            outOfStockBooks,
            topBooks,
            categoryStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
