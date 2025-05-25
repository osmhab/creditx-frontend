import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/estimation", async (req, res) => {
  try {
    const { formData: bien } = req.body;

    const prompt = `
Tu es un expert en financement hypothécaire en Suisse.
Estime les deux valeurs suivantes à partir des données ci-dessous :
1. La valeur de marché la plus réaliste en CHF
2. La valeur qu'une banque pourrait reconnaître en CHF

Voici les données :
- Type de bien : ${bien.type || "non spécifié"}
- Adresse : ${bien.adresseComplete || "non spécifiée"}
- NPA Localité : ${bien.npaLocalite}
- Année de construction : ${bien.anneeConstruction || "non spécifiée"}
- Année(s) de rénovation : ${bien.anneeRenovation || "non spécifiée"}
- Type de construction : ${bien.typeConstruction || "non spécifié"}
- État : ${bien.etat || "non spécifié"}
- Orientation : non précisé
- Type de construction : Construction traditionnelle
- Surface brute : ${bien.surfaceHabitable || 0} m²
- Surface terrain : ${bien.surfaceTerrain || 0} m²
- Surface jardin : ${bien.surfaceJardin || 0} m²
- Surface terrasse/balcon : ${bien.surfaceBalcon || 0} m²
- Nombre de pièces : ${bien.nbPieces || 0}
- Nombre de salles d’eau : ${bien.nbSallesEau || 0}
- Type de chauffage : ${bien.chauffageType || "non spécifié"}
- Distribution de chaleur : ${bien.chauffageDistribution || "non spécifiée"}
- Nombre de places de parc intérieures : ${bien.placesInt || 0}
- Nombre de places de parc extérieures : ${bien.placesExt || 0}
- Photovoltaïque : non précisé
- Solaires thermiques : non précisé
- Certificats : non précisés

Réponds uniquement avec ce format JSON strict **sans aucun mot autour** :
{
  "valeurEstimeeMarche": 800000,
  "valeurEstimeeBanque": 760000
}
`;

    const estimations = [];

    for (let i = 0; i < 5; i++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Tu es un expert hypothécaire suisse." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      });

      const content = completion.choices?.[0]?.message?.content;
      console.log(`🔁 Estimation ${i + 1} :`, content);

      try {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          estimations.push(parsed);
        } else {
          console.error(`❌ Aucun bloc JSON valide dans :`, content);
        }
      } catch (err) {
        console.error(`❌ Erreur parsing JSON estimation ${i + 1} :`, content);
      }
    }

    if (estimations.length === 0) {
      throw new Error("Aucune estimation valide reçue.");
    }

    const moyenne = estimations.reduce(
      (acc, curr) => {
        acc.valeurEstimeeMarche += curr.valeurEstimeeMarche;
        acc.valeurEstimeeBanque += curr.valeurEstimeeBanque;
        return acc;
      },
      { valeurEstimeeMarche: 0, valeurEstimeeBanque: 0 }
    );

    const valeurEstimeeMarche = Math.round(moyenne.valeurEstimeeMarche / estimations.length);
    const valeurEstimeeBanque = Math.round(moyenne.valeurEstimeeBanque / estimations.length);

    res.json({ valeurEstimeeMarche, valeurEstimeeBanque });

  } catch (err) {
    console.error("❌ Erreur backend /api/estimation :", err);
    res.status(500).json({ error: "Erreur interne serveur estimation." });
  }
});

app.listen(port, () => {
  console.log(`✅ Serveur backend actif sur http://localhost:${port}`);
});
