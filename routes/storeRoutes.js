const express = require('express');
const Store = require('../models/store');

const storeRouter = express.Router();

async function isAuthenticated(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/admin/login')
    }
}

storeRouter.get('/admin/stores', isAuthenticated, (req, res) => {
    Store.find()
    .then(result => {
        res.render('admin/stores', { stores: result });
    })
})

storeRouter.get('/admin/addStore', isAuthenticated, (req, res) => {
    res.render('admin/addStore');
})

storeRouter.post('/admin/addStore', isAuthenticated, (req, res) => {
    const store = new Store({
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        opening: req.body.opening,
        location: req.body.location
    });
    store.save()
        .then(() => {
            res.redirect('/admin/addStore');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error adding store');
        })
})

storeRouter.get('/admin/updateStore/:id', isAuthenticated, (req, res) => {
    const id = req.params.id;
    Store.findById(id)
    .then(store => {
        res.render('admin/updateStore', { store: store });
    })
})

storeRouter.post('/admin/updateStore/:id', isAuthenticated, async (req, res) => {
    const id = req.params.id;
    const store = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        opening: req.body.opening,
        location: req.body.location
    }
    await Store.findByIdAndUpdate(id, store)
    res.redirect('/admin/stores');
})

storeRouter.get('/admin/deleteStore/:id', isAuthenticated, async (req, res) => {
    const id = req.params.id;
    Store.findByIdAndDelete(id)
    .then(() => {
        res.redirect('/admin/stores');
    })
})

module.exports = storeRouter;