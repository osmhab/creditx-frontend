import express from "express";
import multer from "multer";
import { extraireTexte } from "../ocr/visionHelper.js";

const upload = multer(); // mémoire uniquement
const router = express.Router();

router.post("/api/ocr", upload.single("fichier"), async (req, res) => {
  try {
    console.log("📎 Fichier reçu :", req.file?.originalname, req.file?.mimetype, req.file?.size);

    const texte = await extraireTexte(req.file.buffer, req.file.mimetype);
    res.json({ texte });
  } catch (error) {
    console.error("Erreur OCR:", error);
    res.status(500).json({ error: "Erreur OCR" });
  }
});

export default router;
