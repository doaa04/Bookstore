const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');


const Service = require('../models/service');

const serviceRouter = express.Router();

const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = path.join(__dirname, '../public/services');
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const serviceUpload = multer({ storage: serviceStorage });


serviceRouter.get('/admin/services', (req, res) => {
    Service.find() 
    .then(result => {
        res.render('admin/services', { services: result });
    })
})

serviceRouter.get('/admin/addService', (req, res) => {
    res.render('admin/addService');
})

serviceRouter.get('/admin/updateService/:id', (req, res) => {
    const id = req.params.id;
    Service.findById(id)
    .then(result => {
        res.render('admin/updateService', { service: result });
    })
    .catch(err => console.log(err));
})

serviceRouter.post('/admin/updateServiceData/:id',serviceUpload.single("serviceImage"),  async (req, res) => {
    const id = req.params.id;
    const existingService = await Service.findById(id);
    const oldImageUrl = existingService.imageUrl;

    if (req.file) {
        fs.unlinkSync(path.join(__dirname, '../public', oldImageUrl));
    }

    let imageUrl = req.file ? `/services/${req.file.filename}` : oldImageUrl;
    const updatedServiceData = {
        title: req.body.title,
        description: req.body.description,
        imageUrl: imageUrl
    };
    await Service.findByIdAndUpdate(id, updatedServiceData)
    res.redirect('/admin/services');
})


serviceRouter.post('/admin/addService', serviceUpload.single("serviceImage"), (req, res) => {
    const fileName = req.file ? req.file.filename : undefined;
    const imageUrl = `/services/${fileName}`;
    const newService = new Service({
        title: req.body.title ? req.body.title : undefined,
        description: req.body.description,
        imageUrl: imageUrl
    });
    newService.save()
        .then(book => {
            res.redirect('/admin/addService');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error adding service');
        });
})

serviceRouter.get('/admin/deleteService/:id', async (req, res) => {
    const id = req.params.id;
    const service = await Service.findById(id);
    const oldImageUrl = service.imageUrl;
    fs.unlinkSync(path.join(__dirname, `../public/${oldImageUrl}`));

    Service.findByIdAndDelete(id)
    .then(() => {
        res.redirect('/admin/services');
    })
})

module.exports = serviceRouter; 