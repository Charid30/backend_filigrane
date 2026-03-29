'use strict';

const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  // Supprimer le fichier uploadé en cas d'erreur
  if (req.file?.path) {
    fs.unlink(req.file.path, () => {});
  }

  const status = err.status || 500;
  const message = err.message || 'Une erreur interne est survenue.';

  console.error(`[ERREUR ${status}]`, err);

  res.status(status).json({ erreur: message });
};

module.exports = { errorHandler };
