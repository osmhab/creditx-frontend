import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import ocrRoute from "./routes/ocrRoute.js";
import { getPromptParType } from './getPromptParType.js'; // ajuste le chemin si besoin



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

    const variantes = [
  "Estime les montants comme un expert hypothécaire suisse ayant accès aux ventes comparables.",
  "Base ton estimation sur les données que tu reçois et sur ta connaissance du marché suisse.",
  "Sois pragmatique et donne une estimation en CHF même si certaines données sont imprécises.",
  "Réponds avec des valeurs numériques réalistes en te basant sur des cas similaires.",
  "Ne refuse jamais d’estimer. Donne une valeur basée sur ton expérience simulée du marché immobilier suisse."
];


    const makePrompt = (variante) => {
      return `
Tu es un expert en financement hypothécaire en Suisse.
Estime les deux valeurs suivantes à partir des données ci-dessous :
1. La valeur de marché la plus réaliste en CHF
2. La valeur qu'une banque pourrait reconnaître en CHF

Voici les données :
- Type de bien : ${bien.type || "non spécifié"}
- Adresse : ${bien.adresseComplete || "non spécifiée"}
- NPA Localité : ${bien.npaLocalite || "non précisé"}
- Année de construction : ${bien.anneeConstruction || "non spécifiée"}
- Année(s) de rénovation : ${bien.anneeRenovation || "non spécifiée"}
- Type de construction : ${bien.typeConstruction || "non spécifié"}
- État : ${bien.etat || "non spécifié"}
- Surface habitable : ${bien.surfaceHabitable > 0 ? `${bien.surfaceHabitable} m²` : "non précisée"}
- Surface terrain : ${bien.surfaceTerrain > 0 ? `${bien.surfaceTerrain} m²` : "non précisée"}
- Surface jardin : ${bien.surfaceJardin > 0 ? `${bien.surfaceJardin} m²` : "non précisée"}
- Surface terrasse/balcon : ${bien.surfaceBalcon > 0 ? `${bien.surfaceBalcon} m²` : "non précisée"}
- Nombre de pièces : ${bien.nbPieces || "non précisé"}
- Nombre de salles d’eau : ${bien.nbSallesEau || "non précisé"}
- Type de chauffage : ${bien.chauffageType || "non spécifié"}
- Distribution de chaleur : ${bien.chauffageDistribution || "non spécifiée"}
- Places de parc intérieures : ${bien.placesInt || 0}
- Places de parc extérieures : ${bien.placesExt || 0}
- Orientation : non précisée
- Photovoltaïque : non précisé
- Solaires thermiques : non précisé
- Certificats : non précisés

${variante}

Tu dois toujours répondre avec deux valeurs chiffrées, même si certaines données sont manquantes ou imprécises.
Réponds uniquement avec ce format JSON strict, sans aucun mot autour, ni explication :


{
  "valeurEstimeeMarche": <nombre>,
  "valeurEstimeeBanque": <nombre>
}
`;
    };

    const estimations = [];

    for (let i = 0; i < 5; i++) {
      const variante = variantes[Math.floor(Math.random() * variantes.length)];
      const prompt = makePrompt(variante);

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Tu es un expert hypothécaire suisse." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3 + Math.random() * 0.2, // entre 0.3 et 0.5
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


app.use(ocrRoute);



app.post("/api/analyse-document", async (req, res) => {
  try {
    const { texte, formData, typeAttendu } = req.body;

    if (!texte || !typeAttendu || !formData) {
      return res.status(400).json({ error: "Données manquantes dans la requête" });
    }

    const prompt = getPromptParType(typeAttendu, texte, formData);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        { role: "system", content: "Tu es un assistant expert en documents financiers suisses." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    console.log("🧠 Réponse GPT brute :", raw);

    const match = raw.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;

    if (!json) throw new Error("Réponse invalide de GPT");

    res.json(json);
  } catch (error) {
    console.error("❌ Erreur analyse document :", error);
    res.status(500).json({ error: "Erreur dans l'analyse du document." });
  }
});



// 👇 Ce bloc doit rester à la toute fin
app.listen(port, () => {
  console.log(`✅ Serveur backend actif sur http://localhost:${port}`);
});
