const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();
const app = express();
const port = 5050;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/estimation', async (req, res) => {
  const { localisation, surface, standing, annee, terrain, prixSouhaite, nombrePieces, terrasse, piscine, ascenseur, etages } = req.body;

  const prompt = `
  Tu es un expert en évaluation immobilière en Suisse.
  Estime la valeur d'un bien immobilier avec les caractéristiques suivantes :
  
  - Localisation : ${localisation}
  - Surface habitable : ${surface} m²
  - Surface du terrain : ${terrain} m²
  - Année de construction : ${annee}
  - Standing : ${standing}
  - Nombre de pièces : ${nombrePieces}
  - Terrasse : ${terrasse ? terrasse + ' m²' : 'Aucune terrasse'}
  - Piscine : ${piscine ? 'Oui' : 'Non'}
  - Ascenseur : ${ascenseur ? 'Oui' : 'Non'}
  - Nombre d'étages : ${etages}

  Donne une estimation de prix réaliste en CHF sous la forme de trois valeurs :
  
  1. Valeur moyenne estimée : [Valeur]
  2. Valeur inférieure estimée : [Valeur]
  3. Valeur supérieure estimée : [Valeur]
  
  N'inclus aucun autre texte. Présente ces valeurs uniquement dans l'ordre ci-dessus.
  `;

  try {
    const chat = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
    });

    const resultText = chat.choices[0].message.content;
    console.log("Texte brut de GPT-4 :", resultText);

    // Extraction simple des valeurs estimées
    const values = resultText.split("\n");
    const estimatedValue = values[0]?.split(":")[1]?.trim(); 
    const lowerValue = values[1]?.split(":")[1]?.trim();
    const upperValue = values[2]?.split(":")[1]?.trim();

    // Nettoyage des espaces et conversion des valeurs en nombres
    const estimatedValueNumber = parseFloat(estimatedValue.replace(/\s/g, '').replace(',', ''));
    const lowerValueNumber = parseFloat(lowerValue.replace(/\s/g, '').replace(',', ''));
    const upperValueNumber = parseFloat(upperValue.replace(/\s/g, '').replace(',', ''));

    // Comparaison avec le prix souhaité
    const prixSouhaiteNumber = parseFloat(prixSouhaite.replace(/\s/g, '').replace(',', ''));

    let warningMessage = '';
    let successMessage = '';

    // Comparaison du prix souhaité avec l'estimation
    if (prixSouhaiteNumber > upperValueNumber) {
      warningMessage = `Avertissement : Le prix que vous souhaitez payer est supérieur à l'estimation de l'IA pour cette propriété. Selon le marché immobilier actuel dans la région de ${localisation}, il est possible que le prix soit surestimé.`;
    } else if (prixSouhaiteNumber < lowerValueNumber) {
      warningMessage = `Avertissement : Le prix que vous souhaitez payer est inférieur à l'estimation de l'IA pour cette propriété. Vous pourriez envisager d'augmenter votre offre pour mieux correspondre à la valeur estimée.`;
    } else {
      successMessage = `OK. Le prix souhaité est dans la fourchette estimée par l'IA.`;
    }

    console.log("Valeurs extraites : ", { estimatedValue, lowerValue, upperValue });

    res.json({
      averageValue: estimatedValue,
      lowerValue: lowerValue,
      upperValue: upperValue,
      warningMessage: warningMessage,  // Message d'avertissement
      successMessage: successMessage,  // Message de succès
    });

  } catch (err) {
    console.error("🔥 Erreur OpenAI :", err);
    res.status(500).json({ error: "Erreur lors de l'appel à OpenAI", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend IA lancé sur http://localhost:${port}`);
});
