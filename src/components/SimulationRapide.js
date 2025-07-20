// src/components/SimulationRapide.js
import React, { useState } from 'react';

const SimulationRapide = () => {
  const [bien, setBien] = useState('');
  const [cash, setCash] = useState('');
  const [lpp, setLpp] = useState('');
  const [revenu, setRevenu] = useState('');
  const [resultat, setResultat] = useState(null);

  const formatCHF = (val) => {
    if (isNaN(val)) return '';
    return Number(val).toLocaleString('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
  };

  const handleNumberInput = (e, setter) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setter(value);
  };

  const calculer = () => {
    const bienNum = parseFloat(bien);
    const cashNum = parseFloat(cash);
    const lppNum = parseFloat(lpp);
    const revenuNum = parseFloat(revenu);

    if (!bienNum || !revenuNum) return;

    const fondsPropres = (cashNum || 0) + (lppNum || 0);
    const fondsPropresDurs = (cashNum || 0);
    const montantEmprunte = bienNum - fondsPropres;
    const chargeAnnuelle = (montantEmprunte * 0.05) + (bienNum * 0.01);
    const mensualite = chargeAnnuelle / 12;
    const ratioFondsPropres = (fondsPropres / bienNum) * 100;
    const fondsDursOK = (fondsPropresDurs / bienNum) >= 0.1;

    setResultat({
      montantEmprunte,
      mensualite,
      ratioFondsPropres,
      fondsDursOK,
    });
  };

  const isFormValid = bien && revenu;

  return (
    <section className="bg-white py-24 px-6 md:px-12 flex justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8 md:p-10 border border-gray-100 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Simulez votre crédit hypothécaire</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="animate-fade-in delay-100">
            <label className="block mb-1 font-medium">🏠 Montant du bien souhaité</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCHF(bien)}
              onChange={(e) => handleNumberInput(e, setBien)}
              className="w-full p-3 border rounded focus:ring focus:ring-blue-200"
              placeholder="ex: 800'000"
            />
          </div>

          <div className="animate-fade-in delay-200">
            <label className="block mb-1 font-medium">💼 Revenus annuels</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCHF(revenu)}
              onChange={(e) => handleNumberInput(e, setRevenu)}
              className="w-full p-3 border rounded focus:ring focus:ring-blue-200"
              placeholder="ex: 120'000"
            />
          </div>

          <div className="animate-fade-in delay-300">
            <label className="block mb-1 font-medium">💰 Fonds propres - Cash / 3e pilier</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCHF(cash)}
              onChange={(e) => handleNumberInput(e, setCash)}
              className="w-full p-3 border rounded focus:ring focus:ring-blue-200"
              placeholder="ex: 100'000"
            />
          </div>

          <div className="animate-fade-in delay-400">
            <label className="block mb-1 font-medium">🏦 Fonds propres - LPP</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatCHF(lpp)}
              onChange={(e) => handleNumberInput(e, setLpp)}
              className="w-full p-3 border rounded focus:ring focus:ring-blue-200"
              placeholder="ex: 50'000"
            />
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={calculer}
            disabled={!isFormValid}
            className={`px-10 py-4 rounded-full text-lg font-semibold transition-transform duration-200 text-white ${
              isFormValid ? 'bg-black hover:bg-gray-900 hover:scale-105 active:scale-95' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Calculer
          </button>
        </div>

        {resultat && (
          <div className="mt-12 bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-center">Résultat de la simulation</h3>
            <p className="mb-2 text-center">Montant à emprunter : <strong>{formatCHF(resultat.montantEmprunte)}</strong></p>
            <p className="mb-2 text-center">Mensualité théorique : <strong>{formatCHF(resultat.mensualite)}</strong></p>
            <p className="mb-2 text-center">Ratio fonds propres : <strong>{resultat.ratioFondsPropres.toFixed(1)}%</strong></p>

            {resultat.fondsDursOK ? (
              <p className="text-green-600 font-semibold text-center mt-4">
                ✅ Projet conforme aux exigences bancaires (fonds propres durs ≥ 10%).
              </p>
            ) : (
              <p className="text-red-600 font-semibold text-center mt-4">
                ⚠️ Vos fonds propres en cash / 3e pilier sont inférieurs au minimum de 10% requis.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SimulationRapide;