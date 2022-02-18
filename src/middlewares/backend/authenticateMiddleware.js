exports.isLoggedIn = async (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        return res.redirect('/login');
    }
};

exports.guest = async (req, res, next) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        return next();
    }
};