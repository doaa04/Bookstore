const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

const mongodb = require('mongodb'); 
const mongoose = require('mongoose');
const uriJ = "mongodb+srv://root:root@cluster0.djhput1.mongodb.net/database0?retryWrites=true&w=majority&appName=Cluster0";
const uri = "mongodb://localhost:27017/database0";


mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then((result) => app.listen(3000))
.catch((err) => console.log(err));

const userRoutes = require('./routes/userRoutes');
app.use(userRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use(adminRoutes);

app.use((req, res) => {
    res.render('404');
});


