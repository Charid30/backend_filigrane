'use strict';

const TEXTE_MAX = 120;
const TAILLE_MIN = 12;
const TAILLE_MAX = 120;
const OPACITE_MIN = 5;
const OPACITE_MAX = 100;
const POSITIONS_VALIDES = ['centre', 'diagonal'];

const validerFiligrane = (req, res, next) => {
  const { texte, taille, opacite, position } = req.body;

  if (!texte || typeof texte !== 'string' || !texte.trim()) {
    return res.status(400).json({ erreur: 'Le texte du filigrane est requis.' });
  }

  if (texte.trim().length > TEXTE_MAX) {
    return res.status(400).json({ erreur: `Le texte ne doit pas dépasser ${TEXTE_MAX} caractères.` });
  }

  if (taille !== undefined) {
    const t = parseInt(taille);
    if (isNaN(t) || t < TAILLE_MIN || t > TAILLE_MAX) {
      return res.status(400).json({ erreur: `La taille doit être entre ${TAILLE_MIN} et ${TAILLE_MAX}.` });
    }
  }

  if (opacite !== undefined) {
    const o = parseInt(opacite);
    if (isNaN(o) || o < OPACITE_MIN || o > OPACITE_MAX) {
      return res.status(400).json({ erreur: `L'opacité doit être entre ${OPACITE_MIN} et ${OPACITE_MAX}.` });
    }
  }

  if (position !== undefined && !POSITIONS_VALIDES.includes(position)) {
    return res.status(400).json({ erreur: `Position invalide. Valeurs acceptées : ${POSITIONS_VALIDES.join(', ')}.` });
  }

  next();
};

module.exports = { validerFiligrane };
