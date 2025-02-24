const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProducts, getSingleProduct } = require('../controllers/product.controller');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const  Cloudinary  = require('../config/cloudinary')
const multer = require('multer');

const app = express();

const router = express.Router();

const storage = new CloudinaryStorage({
    cloudinary : Cloudinary,
    params: {
        folder: 'products',
        allowedFormats: ['jpg', 'png', 'jpeg'],
    },
})

const upload = multer({ storage });


router.route('/').post(upload.array('images'), createProduct).get(getProducts)
router.route('/:productID').put(upload.array('newImages') , updateProduct).delete(deleteProducts).get(getSingleProduct)

module.exports = router;