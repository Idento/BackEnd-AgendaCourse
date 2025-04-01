export const isAuthentified = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
}

export const isAuthAndAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'administrateur') {
        next();
    } else {
        res.status(401).json({ message: 'Authentication failed' });
    }
}