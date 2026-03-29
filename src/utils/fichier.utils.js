'use strict';

const fs = require('fs');

/**
 * Supprime un fichier sans lever d'exception s'il n'existe pas.
 */
const supprimerFichier = (chemin) => {
  if (!chemin) return;
  fs.unlink(chemin, () => {});
};

module.exports = { supprimerFichier };
