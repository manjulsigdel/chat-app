const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { successResponse, errorResponse } = require('../server/utils/response');

// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', function (req, res) {
    res.render('register');
});

// Register Process
router.post('/register',
    [check('name', 'Name is required').isLength({ min: 1 }),
    check('email', 'Email is required').isLength({ min: 1 }),
    check('email', 'Email is not valid').isEmail(),
    check('username', 'Username is required').isLength({ min: 1 }),
    check('password', 'Password is required').isLength({ min: 1 }),
    check('password2', 'Passwords do not match').isLength({ min: 1 }).custom((value, { req }) => value === req.body.password)],
    function (req, res) {
        // Get the validation result whenever you want; see the Validation Result API for all options!
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('register', {
                errors: errors.mapped()
            });
        } else {
            let user = new User();
            user.name = req.body.name;
            user.email = req.body.email;
            user.username = req.body.username;
            user.password = req.body.password;
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(user.password, salt, function (err, hash) {
                    if (err) {
                        console.log(err);
                    }
                    user.password = hash;
                    user.save(function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            req.flash('success', 'You are now registered and can log in');
                            res.redirect('/users/login');
                        }
                    });
                });
            });
        }
    }
);

// Login Form
router.get('/login', function (req, res) {
    res.render('login');
});

// Login Process
router.post('/login', function (req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Logout
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect('/users/login');
});

router.get('/:id', function(req, res){
    User.findById(req.params.id).then((user)=>{
        res.send(successResponse(user.name, "User Found Successfully"));
    },(e)=>{
        res.send(errorResponse(null, "Could Not Get User"));
    });
});

module.exports = router;