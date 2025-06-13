export const getPromptParType = (typeAttendu, texte, formData) => {
  if (typeAttendu === "Certificat 2e pilier") {
    return `
Tu es un expert en prévoyance suisse.

Objectif : analyser un **Certificat LPP** pour un retrait anticipé.

Fais 3 choses :
1. Vérifie que le document est bien un certificat 2e pilier valable
2. Extrait :
   - nom de la personne
   - montant disponible pour un retrait EPL
   - institution émettrice
   - date de validité
3. Compare avec le formulaire utilisateur : la somme déclarée en fonds propres 2e pilier est-elle ≤ au montant disponible ?

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds uniquement avec ce JSON :
{
  "typeDocument": "...",
  "infosExtraites": {
    "nom": "...",
    "montantDisponibleEPL": "...",
    "date": "...",
    "institution": "..."
  },
  "comparaison": {
    "type": "identique | différent",
    "montant": "ok | insuffisant",
    "institution": "correspondance approximative | non reconnu"
  },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}
`;
  }

  if (typeAttendu === "Relevé 3e pilier bancaire") {
    return `
Tu es un expert en analyse de relevés bancaires suisses.

Objectif : analyser un **relevé 3e pilier bancaire**.

Fais 3 choses :
1. Vérifie qu’il s’agit d’un relevé de 3e pilier bancaire (et non assurance)
2. Extrait :
   - nom
   - montant disponible
   - institution
   - date du relevé
3. Compare avec le formulaire utilisateur : le montant est-il cohérent avec ce qui est déclaré dans les fonds propres 3a ?

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds uniquement avec ce JSON :
{
  "typeDocument": "...",
  "infosExtraites": {
    "nom": "...",
    "montant": "...",
    "date": "...",
    "institution": "..."
  },
  "comparaison": {
    "type": "identique | différent",
    "montant": "ok | insuffisant",
    "institution": "correspondance approximative | non reconnu"
  },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}
`;
  }

  if (typeAttendu === "Attestation rachat 3e pilier assurance") {
    return `
Tu es un expert en prévoyance suisse.

Objectif : analyser une **attestation de rachat 3e pilier (assurance)**.

Fais 3 choses :
1. Vérifie que c’est bien un contrat de rachat 3e pilier assurance
2. Extrait le nom, le montant du rachat, la date, et l’institution d’assurance
3. Compare avec le montant déclaré par l’utilisateur dans les fonds propres 3a assurance

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Relevé de compte bancaire") {
    return `
Tu es un expert en analyse de relevés bancaires suisses.

Objectif : analyser un **relevé de compte bancaire personnel**.

1. Vérifie que c’est un relevé officiel (avec nom, banque, date, solde)
2. Extrait ces informations et compare le solde avec le montant déclaré comme fonds propres bancaires

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Extrait de poursuites") {
    return `
Tu es un expert juridique suisse.

Analyse un **extrait de l’office des poursuites**.

1. Vérifie que le document est bien un extrait de poursuites officiel
2. Extrait le nom, la date d’émission, et s’il contient des poursuites actives
3. Compare avec ce que l’utilisateur a déclaré (présence ou non de poursuites)

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Déclaration d'impôt") {
    return `
Tu es un assistant fiscal suisse.

Objectif : analyser une **déclaration d’impôt**.

1. Vérifie qu’il s’agit bien d’une déclaration d’impôt complète (avec nom, année fiscale, et tampon fiscal)
2. Extrait les informations clés et compare les noms/dates avec ceux du formulaire utilisateur

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Contrat de vente") {
    return `
Tu es un expert notarial suisse.

Objectif : analyser un **contrat de vente** d’un bien immobilier.

1. Vérifie qu’il s’agit bien d’un contrat de vente signé
2. Extrait les noms, la date, le prix du bien et l’adresse
3. Compare avec les données du formulaire utilisateur (prix, bien immobilier, acheteur)

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Contrat de réservation") {
    return `
Tu es un assistant immobilier.

Analyse un **contrat de réservation** d’un logement.

1. Vérifie qu’il s’agit d’un document valide avec signature
2. Extrait le bien, le prix, la date, le nom de l’acheteur
3. Compare ces données au formulaire utilisateur

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Promesse d'achat") {
    return `
Tu es un expert immobilier suisse.

Analyse une **promesse d’achat** d’un bien immobilier.

1. Vérifie qu’il s’agit bien d’une promesse d’achat
2. Extrait l’adresse du bien, le prix, le nom de l’acheteur
3. Compare au dossier client : le bien est-il le bon ? L’acheteur correspond-il ?

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  if (typeAttendu === "Extrait du registre foncier") {
    return `
Tu es un expert en droit immobilier suisse.

Analyse un **extrait du registre foncier**.

1. Vérifie qu’il s’agit bien d’un extrait officiel avec mention du bien
2. Extrait la date, le propriétaire, et les informations du bien
3. Compare avec les données du formulaire utilisateur

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds en JSON :
{
  "typeDocument": "...",
  "infosExtraites": { ... },
  "comparaison": { ... },
  "validation": "valide | incompatible"
}

Texte OCR :
${texte}`;
  }

  // Par défaut : fallback générique
  return `
Tu es un assistant spécialisé en analyse de documents financiers suisses.

Le type de document attendu est : ${typeAttendu}

Fais 3 choses :
1. Identifie le type réel du document
2. Extrait les infos clés (nom, montant, date, institution)
3. Compare avec les données utilisateur

Formulaire utilisateur :
${JSON.stringify(formData, null, 2)}

Réponds au format JSON avec typeDocument, infosExtraites, comparaison et validation.

Texte OCR :
${texte}`;
};
