const isCreator = (req, res, next) => {
    if(req.user && req.user.role === 'creator') return next();
    res.status(403).json({ message: 'Access denied- creators only'});
}

const isBrand = (req, res, next) => {
    if(req.user && req.user.role === 'brand') return next();
    res.status(403).json({ message: 'Access denied- brands only'});
}

const isAdmin = (req, res, next) => {
    if(req.user && req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Access denied- admins only'});
}

module.exports = { isCreator, isBrand, isAdmin };