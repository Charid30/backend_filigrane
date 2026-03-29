'use strict';

const fs = require('fs/promises');
const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const sharp = require('sharp');

const toAlpha = (opacite) => Math.min(Math.max(parseInt(opacite) || 40, 5), 100) / 100;

/**
 * Calcule la taille de police pour que le texte tienne dans une cellule de grille.
 * La grille a COLONNES colonnes → chaque cellule fait (largeurPage / COLONNES).
 * On autorise le texte à occuper au max OVERLAP cellules (chevauchement modéré).
 */
const COLONNES = 5;
const LIGNES   = 8;
const OVERLAP  = 1.4; // le texte peut dépasser de 40% la largeur d'une cellule

const calculerFontSizePDF = (font, texte, tailleRequise, largeurPage) => {
  const stepX      = largeurPage / COLONNES;
  const largeurMax = stepX * OVERLAP;
  const tailleBase = Math.min(Math.max(parseInt(tailleRequise) || 22, 8), 60);
  const largeur    = font.widthOfTextAtSize(texte, tailleBase);
  if (largeur <= largeurMax) return tailleBase;
  return Math.max(8, Math.floor(tailleBase * (largeurMax / largeur)));
};

const calculerFontSizeImage = (texte, tailleRequise, largeurImage) => {
  const stepX      = largeurImage / COLONNES;
  const largeurMax = stepX * OVERLAP;
  const tailleBase = Math.min(Math.max(parseInt(tailleRequise) || 22, 8), 60);
  const largeur    = texte.length * tailleBase * 0.55; // estimation
  if (largeur <= largeurMax) return tailleBase;
  return Math.max(8, Math.floor(tailleBase * (largeurMax / largeur)));
};

/**
 * Applique un filigrane sur un PDF et retourne le buffer résultant.
 */
const filigranerPDF = async ({ cheminFichier, texte, taille, opacite, position }) => {
  const pdfBytes = await fs.readFile(cheminFichier);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const alpha = toAlpha(opacite);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    const fontSize   = calculerFontSizePDF(font, texte, taille, width);
    const textWidth  = font.widthOfTextAtSize(texte, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const stepX = width  / COLONNES;
    const stepY = height / LIGNES;

    if (position === 'centre') {
      page.drawText(texte, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: alpha,
      });
    } else {
      const rotate = degrees(45);
      for (let y = -height * 2; y < height * 3; y += stepY) {
        for (let x = -width * 2; x < width * 3; x += stepX) {
          page.drawText(texte, {
            x, y, size: fontSize, font,
            color: rgb(0.5, 0.5, 0.5),
            opacity: alpha, rotate,
          });
        }
      }
    }
  }

  return Buffer.from(await pdfDoc.save());
};

/**
 * Applique un filigrane sur une image (JPG/PNG) et retourne un buffer PDF.
 */
const filigranerImage = async ({ cheminFichier, texte, taille, opacite, position }) => {
  const image = sharp(cheminFichier);
  const { width, height } = await image.metadata();

  const fontSize = calculerFontSizeImage(texte, taille, width);
  const stepX    = width  / COLONNES;
  const stepY    = height / LIGNES;

  const alpha    = toAlpha(opacite);
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');

  let svgContent = '';

  if (position === 'centre') {
    svgContent = `
      <text x="50%" y="50%"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="#808080${alphaHex}" text-anchor="middle" dominant-baseline="middle"
      >${escapeXml(texte)}</text>`;
  } else {
    const lines = [];
    for (let y = -height * 2; y < height * 3; y += stepY) {
      for (let x = -width * 2; x < width * 3; x += stepX) {
        lines.push(`<text x="${x}" y="${y}"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold"
          fill="#808080${alphaHex}" transform="rotate(-45 ${x} ${y})"
        >${escapeXml(texte)}</text>`);
      }
    }
    svgContent = lines.join('\n');
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
  </svg>`;

  const imageFiligranee = await sharp(cheminFichier)
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .png()
    .toBuffer();

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(imageFiligranee);
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(pngImage, { x: 0, y: 0, width, height });

  return Buffer.from(await pdfDoc.save());
};

const escapeXml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = { filigranerPDF, filigranerImage };
