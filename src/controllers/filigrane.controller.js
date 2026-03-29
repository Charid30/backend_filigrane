'use strict';

const { filigranerPDF, filigranerImage } = require('../services/filigrane.service');
const { supprimerFichier } = require('../utils/fichier.utils');

const appliquerFiligrane = async (req, res, next) => {
  const fichier = req.file;

  try {
    if (!fichier) {
      return res.status(400).json({ erreur: 'Aucun fichier reçu.' });
    }

    const { texte, taille, opacite, position } = req.body;
    const options = {
      cheminFichier: fichier.path,
      texte: texte.trim(),
      taille: taille || 48,
      opacite: opacite || 40,
      position: position || 'diagonal',
    };

    let pdfBuffer;

    if (fichier.mimetype === 'application/pdf') {
      pdfBuffer = await filigranerPDF(options);
    } else {
      pdfBuffer = await filigranerImage(options);
    }

    // Suppression immédiate du fichier source (SEC-02)
    supprimerFichier(fichier.path);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="document-filigrane.pdf"',
      'Content-Length': pdfBuffer.length,
      'Cache-Control': 'no-store',
    });

    res.send(pdfBuffer);
  } catch (err) {
    supprimerFichier(fichier?.path);
    next(err);
  }
};

module.exports = { appliquerFiligrane };
