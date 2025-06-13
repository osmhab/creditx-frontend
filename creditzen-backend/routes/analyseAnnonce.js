import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL manquante" });

  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(html);
    const texteAnnonce = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000); // limite à 8000 caractères

    const prompt = `
Tu es un assistant intelligent. À partir du texte brut d'une annonce immobilière, remplis les champs suivants si possible. Utilise des valeurs réalistes.

Voici l’annonce :
"""
${texteAnnonce}
"""

Retourne uniquement cet objet JSON :
{
  "adresseComplete": "",
  "npaLocalite": "",
  "type": "",
  "valeur": "",
  "surfaceHabitable": "",
  "surfaceTerrain": "",
  "nbPieces": "",
  "nbSallesEau": "",
  "surfaceBalcon": "",
  "surfaceCave": "",
  "anneeConstruction": "",
  "anneeRenovation": "",
  "typeConstruction": "",
  "etat": "",
  "placesInt": "",
  "placesExt": ""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const responseText = completion.choices[0].message.content;

    const match = responseText.match(/\{[\s\S]*\}/);
    const champsAutoRemplis = match ? JSON.parse(match[0]) : {};

    res.json({ champsAutoRemplis });
  } catch (err) {
    console.error("❌ Erreur analyseAnnonce :", err);
    res.status(500).json({ error: "Erreur lors de l'analyse de l'annonce" });
  }
});

export default router;
