const mongoose = require('mongoose');
const schema = mongoose.Schema; 

const orderSchema = new schema({
    books: [{
        bookId: {
          type: schema.Types.ObjectId,
          ref: 'Book', 
        },
        quantity: {
          type: Number,
        }
      }],
    user: { type: schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;