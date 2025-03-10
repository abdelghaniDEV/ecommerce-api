const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

// connect
connectDB()

const origin = ['http://localhost:3001' ,  'http://localhost:3000' , 'https://admin-arwa.vercel.app']

app.use(
    cors({
        origin: origin,
        credentials: true, 
    })
)
 
// Middleware
app.use(express.json())
app.use(cookieParser());

// Routes
const categoriesRoute = require('./routes/categories.routes')
const productsRoute = require('./routes/products.routes')
const usersRoute = require('./routes/users.routes')
const ratingRouter = require('./routes/rating.routes')
const ordersRoute = require('./routes/orders.routes')
const customersRoute = require('./routes/customer.routes')

app.use('/api/categories', categoriesRoute )
app.use('/api/products', productsRoute)
app.use('/api/users', usersRoute)
app.use('/api/ratings', ratingRouter)
app.use('/api/orders', ordersRoute)
app.use('/api/customers', customersRoute)



app.listen(2000 , () => {
    console.log('Server is running on port 2000');  // Log to console when server starts.  //
} )
