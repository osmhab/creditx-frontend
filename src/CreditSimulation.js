// src/CreditSimulation.js

import React, { useState } from "react";

function CreditSimulation() {
  const [prixAchat, setPrixAchat] = useState(0);
  const [fondsPropres, setFondsPropres] = useState(0);
  const [utilise2ePillier, setUtilise2ePillier] = useState(false);
  const [fondsPropres2ePillier, setFondsPropres2ePillier] = useState(0);
  const [revenuAnnuel, setRevenuAnnuel] = useState(0);
  const [message, setMessage] = useState("");

  const fondsDur = utilise2ePillier ? fondsPropres - fondsPropres2ePillier : fondsPropres;

  const handleSimulation = () => {
    const totalFondsPropres = fondsPropres;
    const minimumDur = prixAchat * 0.1;
    const minimumTotal = prixAchat * 0.2;

    const montantÀFinancer = prixAchat - totalFondsPropres;
    const chargesAnnuelles = montantÀFinancer * 0.05;
    const chargeMaximale = revenuAnnuel * 0.33;

    if (fondsDur < minimumDur) {
      setMessage("❌ Il faut au moins 10% de fonds propres en dur.");
    } else if (totalFondsPropres < minimumTotal) {
      setMessage("❌ Les fonds propres totaux doivent représenter au moins 20% du prix d'achat.");
    } else if (chargesAnnuelles > chargeMaximale) {
      setMessage(`❌ Charge annuelle estimée CHF ${chargesAnnuelles.toLocaleString()} trop élevée par rapport au revenu. Max autorisé CHF ${chargeMaximale.toLocaleString()}`);
    } else {
      setMessage("✅ Le dossier respecte les exigences de fonds propres et de capacité financière.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Simulation de crédit</h2>

      <label>Prix d'achat (CHF)</label>
      <input
        type="number"
        value={prixAchat}
        onChange={(e) => setPrixAchat(parseFloat(e.target.value))}
        placeholder="ex. 800000"
      />

      <label>Fonds propres totaux (CHF)</label>
      <input
        type="number"
        value={fondsPropres}
        onChange={(e) => setFondsPropres(parseFloat(e.target.value))}
        placeholder="ex. 160000"
      />

      <label style={{ display: "block", marginTop: 10 }}>
        <input
          type="checkbox"
          checked={utilise2ePillier}
          onChange={(e) => setUtilise2ePillier(e.target.checked)}
        /> {" "}J'utilise des fonds provenant de mon 2e pilier
      </label>

      {utilise2ePillier && (
        <div>
          <label>Montant provenant du 2e pilier (CHF)</label>
          <input
            type="number"
            value={fondsPropres2ePillier}
            onChange={(e) => setFondsPropres2ePillier(parseFloat(e.target.value))}
            placeholder="ex. 60000"
          />
        </div>
      )}

      <label>Revenu annuel brut (CHF)</label>
      <input
        type="number"
        value={revenuAnnuel}
        onChange={(e) => setRevenuAnnuel(parseFloat(e.target.value))}
        placeholder="ex. 120000"
      />

      <p style={{ marginTop: 10 }}>💡 Fonds propres en dur estimés : <strong>CHF {fondsDur.toLocaleString()}</strong></p>

      <button onClick={handleSimulation} style={{ marginTop: 10 }}>Lancer la simulation</button>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}

export default CreditSimulation;
