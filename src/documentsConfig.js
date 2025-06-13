const seuilRecence = new Date();
seuilRecence.setMonth(seuilRecence.getMonth() - 6);

const documentsRequis = [
  // --- Documents par personne ---
  {
    id: "pieceIdentite",
    label: "Copie d’une pièce d’identité",
    type: "personne",
    condition: () => true,
  },
  {
    id: "extraitPoursuites",
    label: "Extrait de poursuites (moins de 3 mois)",
    type: "personne",
    condition: () => true,
  },
  {
    id: "permisSejour",
    label: "Permis de séjour",
    type: "personne",
    condition: (personne) =>
      personne.nationalite && personne.nationalite !== "Suisse",
  },
  {
    id: "etatCivilDocument",
    label: "Contrat de mariage ou jugement de divorce",
    type: "personne",
    condition: (personne) =>
      ["marié(e)", "divorcé(e)"].includes(personne.etatCivil),
  },
  {
    id: "fichesSalaire",
    label: "3 dernières fiches de salaire (par employeur)",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some((e) => e.statutEntreprise === "Salarié"),
  },
  {
    id: "certificatSalaire",
    label: "Certificat de salaire annuel",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some((e) => e.statutEntreprise === "Salarié"),
  },
  {
    id: "attestationCDI",
    label: "Attestation de l’employeur (si CDI < 6 mois ou période d’essai)",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some(
        (e) =>
          e.statutEntreprise === "Salarié" &&
          (e.periodeEssai === true || new Date(e.dateDebut) > seuilRecence)
      ),
  },
  {
    id: "attestationBonus",
    label: "Attestation de bonus",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some(
        (e) =>
          Number(e.bonus2024 || 0) > 0 || Number(e.bonus2023 || 0) > 0
      ),
  },
  {
    id: "bilansComptes",
    label: "Bilans et comptes de résultat des 3 dernières années",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some((e) => e.statutEntreprise === "Indépendant"),
  },
  {
    id: "declarationsFiscales",
    label: "Déclarations fiscales des 3 dernières années",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some((e) => e.statutEntreprise === "Indépendant"),
  },
  {
    id: "attestationAVS",
    label: "Attestation AVS indépendant",
    type: "personne",
    condition: (personne) =>
      Array.isArray(personne.employeurs) &&
      personne.employeurs.some((e) => e.statutEntreprise === "Indépendant"),
  },
  {
    id: "zekCredits",
    label: "Extrait ZEK ou justificatif des crédits / leasings",
    type: "personne",
    condition: (personne) =>
      personne.aDesCredits === true || personne.aUnLeasing === true,
  },
  {
    id: "justificatifPension",
    label: "Justificatif de pension alimentaire (jugement ou virement)",
    type: "personne",
    condition: (personne) => personne.payePension === true,
  },

  // --- Fonds propres (niveau dossier) ---
  {
    id: "releveBanque",
    label: "Relevé bancaire / titres (pour les liquidités)",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some((f) => f.type === "Comptes / titres"),
  },
  {
    id: "releve3aBanque",
    label: "Relevé 3e pilier bancaire",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some(
        (f) => f.type === "3e pilier" && f.origine === "banque"
      ),
  },
  {
    id: "releve3aAssurance",
    label: "Relevé 3e pilier assurance",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some(
        (f) => f.type === "3e pilier" && f.origine === "assurance"
      ),
  },
  {
    id: "attestation2ePillar",
    label: "Certificat de prestations LPP (2e pilier)",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some((f) => f.type === "2e pilier"),
  },
  {
    id: "attestationDonation",
    label: "Attestation de donation ou avance d’hoirie",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some(
        (f) => f.type === "Donation" || f.type === "Avance d’hoirie"
      ),
  },
  {
    id: "contratPretTiers",
    label: "Contrat de prêt privé (prêt de tiers)",
    type: "dossier",
    condition: (formData) =>
      Array.isArray(formData?.fondsPropres) &&
      formData.fondsPropres.some((f) => f.type === "Prêt de tiers"),
  },

  // --- Bien immobilier ---
  {
    id: "promesseAchat",
    label: "Promesse d’achat ou contrat de réservation",
    type: "dossier",
    condition: () => true,
  },
  {
    id: "extraitRegistreFoncier",
    label: "Extrait du registre foncier ou numéro de parcelle",
    type: "dossier",
    condition: () => true,
  },
  {
    id: "planEtage",
    label: "Plan d’étage / plan architectural",
    type: "dossier",
    condition: (formData) =>
      formData?.bienImmobilier?.type &&
      ["Appartement PPE", "Villa mitoyenne", "Duplex", "Attique"].includes(
        formData.bienImmobilier.type
      ),
  },
  {
    id: "descriptifPromoteur",
    label: "Descriptif du bien (si achat neuf ou sur plans)",
    type: "dossier",
    condition: (formData) =>
      formData?.bienImmobilier?.type &&
      formData.bienImmobilier.type.toLowerCase().includes("neuf"),
  },
];

export { documentsRequis };
