const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');

// Article Model
let Article = require('../models/article');

// User Model
let User = require('../models/user');

// Add Route
router.get('/add', ensureAuthenticated, function (req, res) {
    res.render('add_article', {
        title: 'Add Article'
    });
});

// Add Submit POST Route
router.post('/add',
    [check('title', 'Title is required').isLength({ min: 1 }),
    check('body', 'Body is required').isLength({ min: 1 })],
    function (req, res) {
        // Get the validation result whenever you want; see the Validation Result API for all options!
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('add_article', {
                title: 'Add Article',
                errors: errors.mapped()
            });
        } else {
            let article = new Article();
            article.title = req.body.title;
            article.author = req.user._id;
            article.body = req.body.body;

            article.save(function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Article Added');
                    res.redirect('/');
                }
            });
        }
    }
);

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        if (article.author != req.user._id) {
            req.flash('danger', 'Not Authorized');
            res.redirect('/');
        } else {
            res.render('edit_article', {
                title: 'Edit Article',
                article: article
            });
        }
    });
});

// Update Submit POST Route
router.post('/edit/:id',
    [check('title', 'Title is required').isLength({ min: 1 }),
    check('author', 'Author is required').isLength({ min: 1 }),
    check('body', 'Body is required').isLength({ min: 1 })],
    function (req, res) {
        // Get the validation result whenever you want; see the Validation Result API for all options!
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            Article.findById(req.params.id, function (err, article) {
                res.render('edit_article', {
                    title: 'Edit Article',
                    article: article,
                    errors: errors.mapped()
                });
            });
        } else {
            let article = {};
            article.title = req.body.title;
            article.author = req.body.author;
            article.body = req.body.body;

            let query = { _id: req.params.id }

            Article.update(query, article, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    req.flash('success', 'Article Updated')
                    res.redirect('/');
                }
            });
        }

    }
);

// Delete Article
router.delete('/:id', function (req, res) {
    if (!req.user._id) {
        res.status(500).send();
    }

    let query = { _id: req.params.id }

    Article.findById(req.params.id, function (err, article) {
        if (article.author != req.user._id) {
            res.status(500).send();
        } else {
            Article.remove(query, function (err) {
                if (err) {
                    console.log(err);
                }
                req.flash('success', 'Article Deleted');
                res.send('Success');
            });
        }
    });
});

// Get Single Article
router.get('/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        User.findById(article.author, function (err, user) {
            res.render('article', {
                article: article,
                author: user.name
            });
        });

    });
});

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('danger', 'Please login');
        res.redirect('/users/login');
    }
}

module.exports = router;