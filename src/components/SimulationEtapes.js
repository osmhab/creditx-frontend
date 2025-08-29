// src/components/SimulationEtapes.js
import React, { useState } from 'react';
import SuccessImage from '../assets/succes.svg';
import ErrorImage from '../assets/error.svg';
import { useNavigate } from 'react-router-dom';
import { ImSpinner2 } from 'react-icons/im';
import { getAuth } from 'firebase/auth';

const SimulationEtapes = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [bien, setBien] = useState('');
  const [cash, setCash] = useState('');
  const [lpp, setLpp] = useState('');
  const [revenu, setRevenu] = useState('');
  const [resultat, setResultat] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const auth = getAuth();
const user = auth.currentUser;

const handleClick = () => {
  if (user) {
    navigate('/formulaire');
  } else {
    navigate('/login-client'); // ou '/connexion'
  }
};

  const formatValue = (val) => {
    if (!val) return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return num.toLocaleString('fr-CH');
  };

  const handleRawInput = (e, setter) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setter(raw);
  };

  const calculer = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const bienNum = parseFloat(bien);
      const cashNum = parseFloat(cash);
      const lppNum = parseFloat(lpp);
      const revenuNum = parseFloat(revenu);

      if (!bienNum || !revenuNum) {
        setIsCalculating(false);
        return;
      }

      const fondsPropres = (cashNum || 0) + (lppNum || 0);
      const fondsPropresDurs = (cashNum || 0);
      const montantEmprunte = bienNum - fondsPropres;
      const chargeAnnuelle = (montantEmprunte * 0.05) + (bienNum * 0.01);
      const mensualite = chargeAnnuelle / 12;
      const ratioFondsPropres = (fondsPropres / bienNum) * 100;
      const fondsDursOK = (fondsPropresDurs / bienNum) >= 0.1;

      const revenuMensuel = revenuNum / 12;
      const ratioCharge = mensualite / revenuMensuel;
      const chargeOK = ratioCharge <= 0.333;

      setResultat({
        montantEmprunte,
        mensualite,
        ratioFondsPropres,
        fondsDursOK,
        chargeOK
      });

      setStep(4);
      setIsCalculating(false);
    }, 600);
  };

  const totalSteps = 3;

  const renderInputBlock = (label, value, setter, placeholder) => (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-lg">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={formatValue(value)}
        onChange={(e) => handleRawInput(e, setter)}
        className="w-full p-5 text-3xl font-bold border rounded focus:ring focus:ring-blue-200 tracking-wide"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <section className="bg-white py-24 px-6 md:px-12 flex justify-center">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-10 items-start">
        <div className="md:w-1/2">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Estimez instantanément votre capacité d’emprunt.
          </h2>
        </div>

        <div className="md:w-1/2 bg-white rounded-2xl shadow-xl w-full p-8 md:p-10 border border-gray-100 animate-fade-in">
          {step <= 3 && (
  <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
    <div
      className="h-2 bg-black rounded-full transition-all duration-500"
      style={{ width: `${(step / totalSteps) * 100}%` }}
    />
  </div>
)}


          {/* Étapes et résultats (inchangé sauf pour le spinner dans les boutons) */}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              {renderInputBlock('Montant du bien souhaité', bien, setBien, "ex: 800000")}
              <button
                onClick={() => setStep(2)}
                disabled={!bien}
                className={`mt-4 px-6 py-3 rounded-full text-white font-semibold text-lg transition ${
                  bien ? 'bg-black hover:bg-gray-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Continuer
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              {renderInputBlock('Fonds propres - Cash / 3e pilier', cash, setCash, "ex: 100000")}
              {renderInputBlock('Fonds propres - LPP', lpp, setLpp, "ex: 50000")}
              <button
                onClick={() => setStep(3)}
                className="mt-4 px-6 py-3 rounded-full text-white font-semibold text-lg bg-black hover:bg-gray-900 transition"
              >
                Continuer
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              {renderInputBlock('Revenus annuels', revenu, setRevenu, "ex: 120000")}
              <button
                onClick={calculer}
                disabled={!revenu || isCalculating}
                className={`mt-4 px-6 py-3 rounded-full text-white font-semibold text-lg transition flex items-center justify-center gap-2 ${
                  revenu && !isCalculating ? 'bg-black hover:bg-gray-900' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isCalculating && <ImSpinner2 className="animate-spin" />}
                Calculer
              </button>
            </div>
          )}

          {step === 4 && (
  <div className="flex flex-col gap-8">
    {isCalculating ? (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4 mx-auto" />
        <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-2" />
        <div className="h-6 bg-gray-200 rounded w-3/5 mx-auto mt-6" />
      </div>
    ) : resultat ? (
      <>
        <div className="border border-gray-200 rounded-xl">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left px-6 py-4 font-semibold text-gray-800 bg-white rounded-t-xl hover:bg-gray-50"
          >
            {showDetails ? '▼ Masquer les données saisies' : '▶ Afficher / modifier les données saisies'}
          </button>
          {showDetails && (
            <div className="p-6 border-t border-gray-200">
              <div className="grid gap-6">
                {renderInputBlock('Montant du bien', bien, setBien, "ex: 800000")}
                {renderInputBlock('Fonds propres - Cash / 3e pilier', cash, setCash, "ex: 100000")}
                {renderInputBlock('Fonds propres - LPP', lpp, setLpp, "ex: 50000")}
                {renderInputBlock('Revenus annuels', revenu, setRevenu, "ex: 120000")}
              </div>
              <button
                onClick={calculer}
                disabled={isCalculating}
                className="mt-6 px-6 py-3 rounded-full text-white font-semibold text-lg bg-black hover:bg-gray-900 transition w-full flex justify-center items-center gap-2"
              >
                {isCalculating && <ImSpinner2 className="animate-spin" />} Recalculer
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow animate-fade-in text-center">
          <h3 className="text-xl font-bold mb-4">Résultat de la simulation</h3>
          <img
            src={resultat.fondsDursOK && resultat.chargeOK ? SuccessImage : ErrorImage}
            alt={resultat.fondsDursOK && resultat.chargeOK ? 'Faisabilité OK' : 'Faisabilité NOK'}
            className="mx-auto mb-6 w-32 h-32"
          />

          {!resultat.fondsDursOK && (
            <p className="text-left text-red-600 font-semibold mt-4">
              ⚠️ Fonds propres en cash / 3e pilier insuffisants (minimum 10% requis).
            </p>
          )}
          {!resultat.chargeOK && (
            <p className="text-left text-red-600 font-semibold mt-4">
              ⚠️ Charges trop élevées par rapport à vos revenus (maximum 33% autorisé).
            </p>
          )}
          {resultat.fondsDursOK && resultat.chargeOK && (
            <>
              <p className="text-left text-green-600 font-semibold mt-4">
                Projet conforme aux exigences bancaires.
              </p>

<div className="text-left text-sm text-gray-500 space-y-2 mt-8">
  <p>
    Montant à emprunter : <strong className="text-gray-800">{formatValue(resultat.montantEmprunte)}</strong>
  </p>
  <p>
    Mensualité théorique : <strong className="text-gray-800">{formatValue(resultat.mensualite)}</strong>
  </p>
  <p>
    Ratio fonds propres : <strong className="text-gray-800">{resultat.ratioFondsPropres.toFixed(1)}%</strong>
  </p>
  <p>
  Charge mensuelle / revenu : <strong className="text-gray-800">{((resultat.mensualite / (revenu / 12)) * 100).toFixed(1)}%</strong>
</p>

</div>



          
<div className="mt-8 flex justify-end">
  <button
    onClick={handleClick}
    className="px-8 py-4 rounded-full bg-black text-white text-lg font-semibold hover:bg-gray-900 transition"
  >
    Passer à l'étape suivante
  </button>
</div>


            </>
          )}
        </div>
      </>
    ) : null}
  </div>
)}
        </div>
      </div>
        </section>
  );
};

export default SimulationEtapes;

