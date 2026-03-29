'use strict';

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const os = require('os');

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const MIMES_ACCEPTES = ['application/pdf', 'image/jpeg', 'image/png'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (MIMES_ACCEPTES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'), { status: 400 }));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = upload;
