import React, { useState } from 'react';

function CreditSimulation() {
  const [revenu, setRevenu] = useState('');
  const [apport, setApport] = useState('');
  const [prixBien, setPrixBien] = useState('');
  const [resultat, setResultat] = useState('');
  const [infos, setInfos] = useState(null);

  const calculerCredit = (e) => {
    e.preventDefault();
  
    if (!revenu || !apport || !prixBien) {
      alert("Veuillez entrer toutes les données.");
      return;
    }
  
    if (parseFloat(apport) >= parseFloat(prixBien)) {
      setResultat("✅ Vous avez suffisamment de fonds propres pour acheter ce bien sans crédit.");
      setInfos(null);
      return;
    }
  
    const revenuAnnuel = parseFloat(revenu) * 12;
    const apportPourcent = (parseFloat(apport) / parseFloat(prixBien)) * 100;
    const coutAnnuelTheorique = parseFloat(prixBien) * 0.05;
    const tauxEffort = coutAnnuelTheorique / revenuAnnuel;
  
    const faisable = apportPourcent >= 20 && tauxEffort <= 0.3334;
  
    setResultat(faisable ? "✅ Crédit faisable !" : "❌ Crédit non faisable.");
    setInfos({
      apportPourcent: apportPourcent.toFixed(1),
      tauxEffort: (tauxEffort * 100).toFixed(1),
      coutAnnuelTheorique: coutAnnuelTheorique.toLocaleString('fr-CH', { style: 'currency', currency: 'CHF' })
    });
  };
  

  return (
    <div>
      <h1>Simulation de crédit</h1>
      <form onSubmit={calculerCredit}>
        <div>
          <label>Revenu mensuel brut (CHF) :</label>
          <input
            type="number"
            value={revenu}
            onChange={(e) => setRevenu(e.target.value)}
          />
        </div>
        <div>
          <label>Apport en fonds propres (CHF) :</label>
          <input
            type="number"
            value={apport}
            onChange={(e) => setApport(e.target.value)}
          />
        </div>
        <div>
          <label>Prix du bien immobilier (CHF) :</label>
          <input
            type="number"
            value={prixBien}
            onChange={(e) => setPrixBien(e.target.value)}
          />
        </div>
        <button type="submit">Calculer</button>
      </form>

      {resultat && <h2>{resultat}</h2>}

      {infos && (
        <div style={{ marginTop: '10px' }}>
          <p>📊 Détail du calcul :</p>
          <ul>
            <li>💰 Apport : {infos.apportPourcent}% du prix du bien</li>
            <li>📉 Capacité financière : {infos.tauxEffort}% du revenu annuel</li>
            <li>🏠 Coût annuel estimé : {infos.coutAnnuelTheorique}</li>
          </ul>
        </div>
      )}

      {resultat && (
        <div style={{ marginTop: '20px' }}>
          <p>
            Pour que le crédit soit faisable :
            <ul>
              <li>✔️ Apport minimum : 20%</li>
              <li>✔️ Capacité financière maximum : 33%</li>
              <li>🧮 Le coût annuel est estimé à 5% du prix du bien</li>
            </ul>
          </p>
        </div>
      )}
    </div>
  );
}

export default CreditSimulation;
