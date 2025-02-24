const express = require('express');
const { getAllCustomer, deleteCustomer, getSingleCustomer } = require('../controllers/customer.controller');

const router = express.Router();

router.route('/').get(getAllCustomer)
router.route('/:customerID').delete(deleteCustomer).get(getSingleCustomer)

module.exports = router;