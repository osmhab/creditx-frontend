import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/estimation", async (req, res) => {
  try {
    const { formData } = req.body;

    const prompt = `
Tu es un expert en financement hypothécaire en Suisse.
Estime les deux valeurs suivantes à partir des données ci-dessous :
1. La valeur de marché la plus réaliste en CHF
2. La valeur qu'une banque pourrait reconnaître en CHF

Voici les données :
- Type de bien : ${formData.sousTypeBien}
- Adresse : ${formData.adresseComplete || "non spécifiée"}
- Année de construction : ${formData.anneeConstruction}
- Année(s) de rénovation : ${formData.anneeRenovation}
- État : ${formData.etatBien}
- Type de construction : ${formData.typeConstruction}
- Surface brute : ${formData.surfaceHabitable} m²
${formData.sousTypeBien !== "appartement" ? `- Surface terrain : ${formData.surfaceTerrain} m²` : ""}
- Surface jardin : ${formData.surfaceJardin} m²
- Surface terrasse/balcon : ${formData.surfaceTerrasse} m²
- Nombre de pièces : ${formData.nombrePieces}
- Nombre de salles d’eau : ${formData.nombreSallesEau}
- Type de chauffage : ${formData.chauffage}
- Photovoltaïque : ${formData.photovoltaique}
- Solaires thermiques : ${formData.solairesThermiques}
- Distribution de chaleur : ${formData.distributionChaleur}
- Certificats : ${(formData.certificats || []).join(", ") || "aucun"}
${formData.sousTypeBien === "appartement" ? `- Quote-part PPE : ${formData.quotePart} ‰` : ""}

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
        const parsed = JSON.parse(content);
        estimations.push(parsed);
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
