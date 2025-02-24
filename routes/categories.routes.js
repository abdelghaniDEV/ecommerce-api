
const express = require('express');
const { createCategory, getAllCategories, updateCategory, deleteCategory, getCategoryByID } = require('../controllers/category.controller');
const { body } = require('express-validator');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const  Cloudinary  = require('../config/cloudinary')
const multer = require('multer');



const router = express.Router();


const storage = new CloudinaryStorage({
    cloudinary : Cloudinary , 
    params : {
        folder: 'uploads',
        allowedFormats: ['jpg', 'png', 'jpeg'],
        // transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
})

const upload = multer({ storage : storage })



router.route('/').post(upload.single('image') , [ body('name').notEmpty().withMessage("Name is required")] , createCategory).get(getAllCategories)
router.route('/:categoryID').put(upload.single('image') , updateCategory).delete(deleteCategory).get(getCategoryByID)



module.exports = router;