const express = require('express');
const { isLoggedIn, isNotLoggedIn, csurfProtection } = require('./middlewares');
const router = express.Router();
const { join, login, logout } = require('../controllers/auth')

router.post('/join', isNotLoggedIn, csurfProtection, join);

router.post('/login', isNotLoggedIn, csurfProtection, login);

router.get('/logout', isLoggedIn, logout);

module.exports = router;