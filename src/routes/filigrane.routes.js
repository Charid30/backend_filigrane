'use strict';

const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { validerFiligrane } = require('../validators/filigrane.validator');
const { appliquerFiligrane } = require('../controllers/filigrane.controller');

router.post(
  '/filigrane',
  upload.single('document'),
  validerFiligrane,
  appliquerFiligrane,
);

module.exports = router;
