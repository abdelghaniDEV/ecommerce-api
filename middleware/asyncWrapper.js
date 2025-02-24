module.exports = (asyncWrapper) => {
    
    return(req , res , next) => {
        asyncWrapper(req , res , next).catch((err) => {
            next(err);
        })
    }
}