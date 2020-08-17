const express = require('express');

const { getOverview, getTour, getLoginForm } = require('../controllers/view');
const { isLoggedIn } = require('../controllers/authentication');

const router = express.Router();

router.use(isLoggedIn);

router.get('/', getOverview);

router.get('/tour/:slug', getTour);

router.get('/auth/login', getLoginForm);

module.exports = router;