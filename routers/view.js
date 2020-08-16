const express = require('express');

const { getOverview, getTour, getLoginForm } = require('../controllers/view');

const router = express.Router();

router.get('/', getOverview);

router.get('/tour/:slug', getTour);

router.get('/auth/login', getLoginForm);

module.exports = router;
