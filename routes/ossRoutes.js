const express = require('express');
const router = express.Router();
const ossController = require('../controllers/ossController');

// Route to get OSS credentials
router.get('/credentials', ossController.getCredentials);

module.exports = router;