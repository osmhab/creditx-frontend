import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import ocrRoute from "./routes/ocrRoute.js";
import { getPromptParType } from "./getPromptParType.js"; // ajuste le chemin si besoin

dotenv.config();
const app = express();
const port = process.env.PORT || 5050;

app.use(cors({ origin: true })); // dev: autorise toutes origines
app.use(express.json());

// Logs simples de requêtes
app.use((req, _res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// Endpoint santé
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ----------------------------------------------------------------
   1) NOUVELLE ROUTE SSE: progression réelle de l’estimation
   Front: EventSource("/api/estimation/stream?formData=...json...")
----------------------------------------------------------------- */
app.get("/api/estimation/stream", async (req, res) => {
  // Headers SSE
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*", // dev only
  });
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Fermer proprement si le client coupe
  req.on("close", () => {
    try {
      res.end();
    } catch (_) {}
  });

  try {
    const bien = JSON.parse(req.query.formData || "{}");

    // ------- Helpers -------
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const boolFr = (b) => (typeof b === "boolean" ? (b ? "oui" : "non") : "non précisé");
    const label = (v) => (v == null ? "non précisé" : String(v).replaceAll("_", " "));
    const adr = bien.adresse || {};
    const adrLine =
      bien.adresseFormatted ||
      [
        adr.streetNumber && adr.route ? `${adr.streetNumber} ${adr.route}` : adr.route,
        [adr.postalCode, adr.locality].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ") || "non spécifiée";

    const ppe = bien.ppe || {};
    const parks = bien.parkings || {};
    const sdb = bien.detailsSdb || {};

    // ------- Données remises au prompt -------
    const donnees = {
      typeBien: label(bien.typeBien),
      sousTypeBien: label(bien.sousTypeBien),
      usage: label(bien.usage),
      adresse: adrLine,
      npa: adr.postalCode || "non précisé",
      localite: adr.locality || "non précisée",

      prixAchat: num(bien.prixAchat),
      montantTravaux: num(bien.montantTravaux),
      montantProjet: num(bien.montantProjet),

      surfaces: {
        habitableBrute: num(bien.surfaceHabitableBrute),
        habitableNette: num(bien.surfaceHabitableNette),
        habitable: num(bien.surfaceHabitable),
        ponderee: num(bien.surfacePonderee),
        terrain: num(bien.surfaceTerrain),
        nbPieces: num(bien.nbPieces),
        nbChambres: num(bien.nbChambres),
      },

      sdbCuisine: {
        nbSdb: num(bien.nbSdb),
        details: {
          familiale: num(sdb.familiale),
          standard: num(sdb.standard),
          wcInvite: num(sdb.wcInvite),
        },
        amenagementCuisine: label(bien.amenagementCuisine),
        coutMoyenSdb: label(bien.coutMoyenSdb),
      },

      etagesParkings: {
        etage: num(bien.etage),
        etagesImmeuble: num(bien.etagesImmeuble),
        ascenseur: boolFr(bien.ascenseur),
        parkingsInterieur: num(parks.interieur),
        parkingsExterieur: num(parks.exterieur),
        parkingsInclusDansPrix: boolFr(parks.inclusDansPrix),
      },

      etatEnergie: {
        etatGeneral: label(bien.etatGeneral),
        chauffage: label(bien.chauffage),
        anneeChauffage: num(bien.anneeChauffage),
        panneauxSolaires: boolFr(bien.panneauxSolaires),
        garagesBox: num(bien.garagesBox),
      },

      ppe: {
        estPPE: ppe.estPPE === true ? "oui" : ppe.estPPE === false ? "non" : "non précisé",
        chargesMensuelles: num(ppe.chargesMensuelles),
        nbLots: num(ppe.nbLots),
      },
    };

    // Variantes pour stimuler l'estimation
    const variantes = [
      "Estime comme un expert hypothécaire suisse ayant accès à des ventes comparables.",
      "Base-toi sur ces données et ta connaissance du marché suisse.",
      "Sois pragmatique et rends une estimation en CHF même si des données sont imprécises.",
      "Donne des valeurs numériques réalistes en te basant sur des cas similaires.",
      "Ne refuse pas d’estimer : fournis des valeurs plausibles pour la Suisse.",
    ];

    const makePrompt = (variante) => `
Tu es un expert en financement hypothécaire en Suisse.
À partir des données ci-dessous, estime DEUX valeurs en CHF :
1) la valeur de marché (réaliste)
2) la valeur bancaire (valeur reconnue par une banque)

Données saisies (utilise-les toutes quand c'est pertinent) :
${JSON.stringify(donnees, null, 2)}

Rappels :
- ${variante}
- Réponds STRICTEMENT en JSON (sans texte autour) au format :
{
  "valeurMarche": <nombre>,
  "valeurBancaire": <nombre>
}
`;

    const runs = 5;
    const estimations = [];

    for (let i = 0; i < runs; i++) {
      // Progression avant l'appel (i terminé sur runs)
      send("progress", { percent: Math.round((i / runs) * 100), step: i + 1, runs });

      const prompt = makePrompt(variantes[Math.floor(Math.random() * variantes.length)]);
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // si indispo, utilise "gpt-4o-mini" et enlève temperature
        temperature: 1, // certains modèles exigent 1 (valeur par défaut)
        messages: [
          { role: "system", content: "Tu es un expert hypothécaire suisse." },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices?.[0]?.message?.content || "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          const valeurMarche = Number(parsed.valeurMarche ?? parsed.valeurEstimeeMarche);
          const valeurBancaire = Number(parsed.valeurBancaire ?? parsed.valeurEstimeeBanque);
          if (Number.isFinite(valeurMarche) && Number.isFinite(valeurBancaire)) {
            estimations.push({ valeurMarche, valeurBancaire });
          }
        } catch {
          // ignore parsing error et continuer
        }
      }

      // Progression après l'appel (i+1 terminés sur runs)
      send("progress", { percent: Math.round(((i + 1) / runs) * 100), step: i + 1, runs });
    }

    if (estimations.length === 0) {
      send("error", { message: "Aucune estimation valide." });
      return res.end();
    }

    const somme = estimations.reduce(
      (acc, e) => ({
        valeurMarche: acc.valeurMarche + e.valeurMarche,
        valeurBancaire: acc.valeurBancaire + e.valeurBancaire,
      }),
      { valeurMarche: 0, valeurBancaire: 0 }
    );

    const valeurMarche = Math.round(somme.valeurMarche / estimations.length);
    const valeurBancaire = Math.round(somme.valeurBancaire / estimations.length);

    send("done", { valeurMarche, valeurBancaire, runs: estimations.length });
    res.end();
  } catch (err) {
    console.error("SSE /api/estimation/stream error:", err);
    try {
      send("error", { message: err.response?.data || err.message || "Unknown error" });
    } catch (_) {}
    res.end();
  }
});

/* ----------------------------------------------------------------
   2) Route POST d’estimation (ancienne) — tu peux la garder
----------------------------------------------------------------- */
app.post("/api/estimation", async (req, res) => {
  try {
    const { formData: bien = {} } = req.body;

    // (on réutilise les mêmes helpers que plus haut)
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const boolFr = (b) => (typeof b === "boolean" ? (b ? "oui" : "non") : "non précisé");
    const label = (v) => (v == null ? "non précisé" : String(v).replaceAll("_", " "));
    const adr = bien.adresse || {};
    const adrLine =
      bien.adresseFormatted ||
      [
        adr.streetNumber && adr.route ? `${adr.streetNumber} ${adr.route}` : adr.route,
        [adr.postalCode, adr.locality].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ") || "non spécifiée";

    const ppe = bien.ppe || {};
    const parks = bien.parkings || {};
    const sdb = bien.detailsSdb || {};

    const donnees = {
      typeBien: label(bien.typeBien),
      sousTypeBien: label(bien.sousTypeBien),
      usage: label(bien.usage),
      adresse: adrLine,
      npa: adr.postalCode || "non précisé",
      localite: adr.locality || "non précisée",
      prixAchat: num(bien.prixAchat),
      montantTravaux: num(bien.montantTravaux),
      montantProjet: num(bien.montantProjet),
      surfaces: {
        habitableBrute: num(bien.surfaceHabitableBrute),
        habitableNette: num(bien.surfaceHabitableNette),
        habitable: num(bien.surfaceHabitable),
        ponderee: num(bien.surfacePonderee),
        terrain: num(bien.surfaceTerrain),
        nbPieces: num(bien.nbPieces),
        nbChambres: num(bien.nbChambres),
      },
      sdbCuisine: {
        nbSdb: num(bien.nbSdb),
        details: {
          familiale: num(sdb.familiale),
          standard: num(sdb.standard),
          wcInvite: num(sdb.wcInvite),
        },
        amenagementCuisine: label(bien.amenagementCuisine),
        coutMoyenSdb: label(bien.coutMoyenSdb),
      },
      etagesParkings: {
        etage: num(bien.etage),
        etagesImmeuble: num(bien.etagesImmeuble),
        ascenseur: boolFr(bien.ascenseur),
        parkingsInterieur: num(parks.interieur),
        parkingsExterieur: num(parks.exterieur),
        parkingsInclusDansPrix: boolFr(parks.inclusDansPrix),
      },
      etatEnergie: {
        etatGeneral: label(bien.etatGeneral),
        chauffage: label(bien.chauffage),
        anneeChauffage: num(bien.anneeChauffage),
        panneauxSolaires: boolFr(bien.panneauxSolaires),
        garagesBox: num(bien.garagesBox),
      },
      ppe: {
        estPPE: ppe.estPPE === true ? "oui" : ppe.estPPE === false ? "non" : "non précisé",
        chargesMensuelles: num(ppe.chargesMensuelles),
        nbLots: num(ppe.nbLots),
      },
    };

    const variantes = [
      "Estime comme un expert hypothécaire suisse ayant accès à des ventes comparables.",
      "Base-toi sur ces données et ta connaissance du marché suisse.",
      "Sois pragmatique et rends une estimation en CHF même si des données sont imprécises.",
      "Donne des valeurs numériques réalistes en te basant sur des cas similaires.",
      "Ne refuse pas d’estimer : fournis des valeurs plausibles pour la Suisse.",
    ];
    const makePrompt = (variante) => `
Tu es un expert en financement hypothécaire en Suisse.
À partir des données ci-dessous, estime DEUX valeurs en CHF :
1) la valeur de marché (réaliste)
2) la valeur bancaire (valeur reconnue par une banque)

Données saisies :
${JSON.stringify(donnees, null, 2)}

Rappels :
- ${variante}
- Réponds STRICTEMENT en JSON (sans texte autour) :
{"valeurMarche": <nombre>, "valeurBancaire": <nombre>}
`;

    const runs = 5;
    const estimations = [];

    for (let i = 0; i < runs; i++) {
      const prompt = makePrompt(variantes[Math.floor(Math.random() * variantes.length)]);
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        temperature: 1, // valeur par défaut requise par certains modèles
        messages: [
          { role: "system", content: "Tu es un expert hypothécaire suisse." },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices?.[0]?.message?.content || "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) continue;

      try {
        const parsed = JSON.parse(match[0]);
        const valeurMarche = Number(parsed.valeurMarche ?? parsed.valeurEstimeeMarche);
        const valeurBancaire = Number(parsed.valeurBancaire ?? parsed.valeurEstimeeBanque);
        if (Number.isFinite(valeurMarche) && Number.isFinite(valeurBancaire)) {
          estimations.push({ valeurMarche, valeurBancaire });
        }
      } catch {
        // ignore parsing error et continuer
      }
    }

    if (estimations.length === 0) {
      throw new Error("Aucune estimation valide.");
    }

    const somme = estimations.reduce(
      (acc, e) => ({
        valeurMarche: acc.valeurMarche + e.valeurMarche,
        valeurBancaire: acc.valeurBancaire + e.valeurBancaire,
      }),
      { valeurMarche: 0, valeurBancaire: 0 }
    );

    const valeurMarche = Math.round(somme.valeurMarche / estimations.length);
    const valeurBancaire = Math.round(somme.valeurBancaire / estimations.length);

    res.json({ valeurMarche, valeurBancaire, runs: estimations.length });
  } catch (err) {
    // 👉 Logs détaillés
    console.error("❌ Erreur backend /api/estimation :");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else if (err.status) {
      console.error("Status:", err.status, "Message:", err.message);
    } else {
      console.error(err);
    }

    return res.status(500).json({
      error: "Erreur interne serveur estimation.",
      details: err.response?.data || err.message || "Unknown error",
    });
  }
});

/* ----------------------------------------------------------------
   OCR + Analyse document (inchangés)
----------------------------------------------------------------- */
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
