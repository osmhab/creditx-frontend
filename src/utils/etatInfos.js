// src/utils/etatInfos.js

// État pour UNE personne (employeurs + charges)
// Règles :
// - si blocage (employeur bloquant OU charges bloquantes) → "Critère bloquant"
// - sinon si tout est complet (≥1 employeur complet & pas bloquant, ET charges complètes) → "Terminé"
// - sinon → "Action requise"
export const computeEtatPersonne = (personne) => {
  const employeurs = Array.isArray(personne?.employeurs) ? personne.employeurs : [];
  const charges = personne?.charges ?? null;

  const empBloquant = employeurs.some((e) => e?.bloquant === true);
  const chBloquant = charges?.bloquant === true;
  if (empBloquant || chBloquant) return "Critère bloquant";

  const hasAnyEmp = employeurs.length > 0;
  const allEmpOk =
    hasAnyEmp && employeurs.every((e) => e?.complet === true && e?.bloquant !== true);

  // Tous les champs sont obligatoires ⇒ on exige charges complètes (et non bloquantes)
  const chargesOk = charges?.complet === true && charges?.bloquant !== true;

  return allEmpOk && chargesOk ? "Terminé" : "Action requise";
};

// État GLOBAL dossier à partir de TOUTES les personnes
// Règles :
// - si ≥1 personne "Critère bloquant" → "Critère bloquant"
// - sinon si ≥1 personne "Action requise" → "Action requise"
// - sinon → "Terminé"
export const computeEtatGlobal = (personnes) => {
  if (!Array.isArray(personnes) || personnes.length === 0) return "Action requise";

  let anyActionRequise = false;

  for (const p of personnes) {
    const etat = computeEtatPersonne(p);
    if (etat === "Critère bloquant") return "Critère bloquant";
    if (etat === "Action requise") anyActionRequise = true;
  }

  return anyActionRequise ? "Action requise" : "Terminé";
};
