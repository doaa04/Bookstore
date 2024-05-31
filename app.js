if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const bcrypt = require("bcrypt");

dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

const mongodb = require('mongodb'); 
const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/database0";


mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then((result) => app.listen(3000))
.catch((err) => console.log(err));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: uri 
    }),
    cookie: { secure: false } 
}));

const userRoutes = require('./routes/userRoutes');
app.use(userRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use(adminRoutes);

app.use((req, res) => {
    res.render('404');
});


// const plainPassword = 'aaa123'; 
// const saltRounds = 10;

// bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
//   if (err) {
//     console.error('Error generating hash:', err);
//   } else {
//     console.log('Hashed password:', hash);
//   }
// });
