// src/pages/DossierINformationsPersonnelles/FormulaireEmployeur.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";

/**
 * FormulaireEmployeur
 * - Gère deux modes : création (employeurId === "nouveau") et édition (index numérique)
 * - Enregistre sous: demandes/{id}.personnes[personneId].employeurs[...]
 * - Applique la logique métier fournie (indépendant/salarié + garde-fous d'ancienneté)
 */

export default function FormulaireEmployeur() {
  const navigate = useNavigate();
  const { personneId, id, employeurId } = useParams();
  const pIndex = Number(personneId);
  const isCreate = employeurId === "nouveau";
  const editIndex = isCreate ? null : Number(employeurId);

  const anneeCourante = new Date().getFullYear();

  // -------- Helpers format CHF --------
  const formatCHF = useCallback((val) => {
    if (val === null || val === undefined || val === "") return "";
    const n = typeof val === "number" ? val : Number(String(val).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(n)) return "";
    return n.toLocaleString("fr-CH");
  }, []);

  const parseCHF = useCallback((s) => {
    if (s === null || s === undefined || s === "") return null;
    const n = Number(String(s).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? null : n;
  }, []);

  // -------- State principal --------
  const [loading, setLoading] = useState(true);
  const [personnes, setPersonnes] = useState([]);
  const [initial, setInitial] = useState(null); // employeur initial si édition

  // Champs communs
  const [statutEntreprise, setStatutEntreprise] = useState(null); // "independant" | "salarie"

  // Indépendant
  const [indep36Plus, setIndep36Plus] = useState(null); // true/false
  const [raisonSociale, setRaisonSociale] = useState(""); // NEW
  const [adresseIndep, setAdresseIndep] = useState(""); // NEW
  const [indepRevenuN1, setIndepRevenuN1] = useState("");
  const [indepRevenuN2, setIndepRevenuN2] = useState("");
  const [indepRevenuN3, setIndepRevenuN3] = useState("");

  // Salarié
  const [salaireIrreg, setSalaireIrreg] = useState(null); // true/false
  const [salaireAncienneteOK, setSalaireAncienneteOK] = useState(null); // contrôle 12m si irrégulier, 3m sinon

  // Détails employeur salariés (communs aux deux branches salarié)
  const [nomEmployeur, setNomEmployeur] = useState("");
  const [adresseEmployeur, setAdresseEmployeur] = useState(""); // Placeholder texte (l’API Google sera branchée ensuite)

  // Revenu brut (base hors bonus)
  const [revenuMode, setRevenuMode] = useState("annuel"); // "annuel" | "mensuel"
  const [frequenceMensuelle, setFrequenceMensuelle] = useState(12); // 12 | 13 (si mensuel)
  const [revenuMontant, setRevenuMontant] = useState("");

  // Bonus
  const [bonusActive, setBonusActive] = useState(null); // true/false
  const [bonusY, setBonusY] = useState("");
  const [bonusY1, setBonusY1] = useState("");
  const [bonusY2, setBonusY2] = useState("");

  // -------- Fetch dossier & employeur --------
  useEffect(() => {
    (async () => {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const pers = Array.isArray(data.personnes) ? data.personnes : [];
        setPersonnes(pers);

        // Pré-remplir si édition
        const currentEmp =
          !isCreate && pers[pIndex]?.employeurs?.[editIndex]
            ? pers[pIndex].employeurs[editIndex]
            : null;

        if (currentEmp) {
          setInitial(currentEmp);
          setStatutEntreprise(currentEmp.statutEntreprise || null);

          if (currentEmp.statutEntreprise === "independant") {
            setRaisonSociale(currentEmp.nom || currentEmp.raisonSociale || ""); // NEW
            setAdresseIndep(
            typeof currentEmp.adresse === "string"
                ? currentEmp.adresse
                : currentEmp.adresse?.formatted || ""
            );
            setIndep36Plus(currentEmp.indep36Plus ?? null);
            setIndepRevenuN1(
              currentEmp.indepRevenu?.[anneeCourante - 1]
                ? formatCHF(currentEmp.indepRevenu[anneeCourante - 1])
                : ""
            );
            setIndepRevenuN2(
              currentEmp.indepRevenu?.[anneeCourante - 2]
                ? formatCHF(currentEmp.indepRevenu[anneeCourante - 2])
                : ""
            );
            setIndepRevenuN3(
              currentEmp.indepRevenu?.[anneeCourante - 3]
                ? formatCHF(currentEmp.indepRevenu[anneeCourante - 3])
                : ""
            );
          }

          if (currentEmp.statutEntreprise === "salarie") {
            setSalaireIrreg(currentEmp.revenusIrreguliers ?? null);
            setSalaireAncienneteOK(currentEmp.salaireAncienneteOK ?? null);
            setNomEmployeur(currentEmp.nom || "");
            setAdresseEmployeur(
              typeof currentEmp.adresse === "string"
                ? currentEmp.adresse
                : currentEmp.adresse?.formatted || ""
            );
            setRevenuMode(currentEmp.revenuBase?.mode || "annuel");
            setFrequenceMensuelle(currentEmp.revenuBase?.frequenceMensuelle || 12);
            setRevenuMontant(
              currentEmp.revenuBase?.montant ? formatCHF(currentEmp.revenuBase.montant) : ""
            );
            const b = currentEmp.bonus || {};
            setBonusActive(
              typeof b[anneeCourante] === "number" ||
                typeof b[anneeCourante - 1] === "number" ||
                typeof b[anneeCourante - 2] === "number"
                ? true
                : currentEmp.bonusActive ?? null
            );
            setBonusY(b[anneeCourante] ? formatCHF(b[anneeCourante]) : "");
            setBonusY1(b[anneeCourante - 1] ? formatCHF(b[anneeCourante - 1]) : "");
            setBonusY2(b[anneeCourante - 2] ? formatCHF(b[anneeCourante - 2]) : "");
          }
        }
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pIndex, employeurId]);

  // -------- Calcul revenu annuel (hors bonus) --------
  const revenuAnnuelCalcule = useMemo(() => {
    const m = parseCHF(revenuMontant);
    if (m == null) return null;
    if (revenuMode === "annuel") return m;
    return frequenceMensuelle === 13 ? m * 13 : m * 12;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revenuMontant, revenuMode, frequenceMensuelle]);

  // -------- Garde-fous d'ancienneté (affichages "FIN DU FORMULAIRE") --------
  const showBlocFinIndep = statutEntreprise === "independant" && indep36Plus === false;
  const showBlocFinSalIrr =
    statutEntreprise === "salarie" && salaireIrreg === true && salaireAncienneteOK === false;
  const showBlocFinSalReg =
    statutEntreprise === "salarie" && salaireIrreg === false && salaireAncienneteOK === false;

  // -------- Validation minimale --------
  const canSave = useMemo(() => {
    if (!statutEntreprise) return false;

    if (statutEntreprise === "independant") {
      if (indep36Plus === null) return false;
      if (indep36Plus === false) return true; // fin du formulaire (message)
      // sinon: raison sociale + 3 revenus requis
      if (!raisonSociale?.trim()) return false; // NEW
      if (!adresseIndep?.trim()) return false; // NEW
      return [indepRevenuN1, indepRevenuN2, indepRevenuN3].every((v) => parseCHF(v) !== null);
    }

    // salarié
    if (salaireIrreg === null) return false;
    if (salaireAncienneteOK === null) return false;
    if (salaireAncienneteOK === false) return true; // fin du formulaire (message)

    // champs requis communs
    if (!nomEmployeur?.trim()) return false;
    if (!adresseEmployeur?.trim()) return false;
    if (parseCHF(revenuMontant) === null) return false;

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statutEntreprise,
    indep36Plus,
    raisonSociale, // NEW
    indepRevenuN1,
    indepRevenuN2,
    indepRevenuN3,
    salaireIrreg,
    salaireAncienneteOK,
    nomEmployeur,
    adresseEmployeur,
    revenuMontant,
  ]);

  // -------- Enregistrer --------
  const handleSave = async () => {
    const ref = doc(db, "demandes", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const pers = Array.isArray(data.personnes) ? [...data.personnes] : [];
    const current = pers[pIndex] || {};
    const empList = Array.isArray(current.employeurs) ? [...current.employeurs] : [];

    let payload = { statutAffichage: "", complet: false };

    if (statutEntreprise === "independant") {
      payload = {
        ...payload,
        statutEntreprise: "independant",
        statutAffichage: "Indépendant",
        indep36Plus: indep36Plus === true,
        nom: raisonSociale?.trim() || "", // NEW
        adresse: adresseIndep?.trim() || "", // NEW
      };

      if (indep36Plus) {
        payload.indepRevenu = {
          [anneeCourante - 1]: parseCHF(indepRevenuN1) || 0,
          [anneeCourante - 2]: parseCHF(indepRevenuN2) || 0,
          [anneeCourante - 3]: parseCHF(indepRevenuN3) || 0,
        };
        payload.complet =
          payload.indepRevenu[anneeCourante - 1] > 0 &&
          payload.indepRevenu[anneeCourante - 2] > 0 &&
          payload.indepRevenu[anneeCourante - 3] > 0 &&
          !!payload.nom;
      } else {
        payload.complet = true; // processus terminé (non éligible)
      }
    }

    if (statutEntreprise === "salarie") {
      const bonusObj = {};
      if (bonusActive) {
        const y = parseCHF(bonusY);
        const y1 = parseCHF(bonusY1);
        const y2 = parseCHF(bonusY2);
        if (y != null) bonusObj[anneeCourante] = y;
        if (y1 != null) bonusObj[anneeCourante - 1] = y1;
        if (y2 != null) bonusObj[anneeCourante - 2] = y2;
      }

      payload = {
        ...payload,
        statutEntreprise: "salarie",
        statutAffichage: "Salarié",
        revenusIrreguliers: salaireIrreg === true,
        salaireAncienneteOK: salaireAncienneteOK === true,
        nom: nomEmployeur?.trim(),
        adresse: adresseEmployeur?.trim(), // On branchera l'objet adresse plus tard
        revenuBase: {
          mode: revenuMode,
          frequenceMensuelle: revenuMode === "mensuel" ? frequenceMensuelle : null,
          montant: parseCHF(revenuMontant) || 0,
        },
        revenuAnnuel: revenuAnnuelCalcule || 0,
        bonus: bonusObj,
        bonusActive: !!bonusActive,
      };

      payload.complet =
        salaireAncienneteOK === false
          ? true // processus terminé (non éligible)
          : !!(payload.nom && payload.adresse && payload.revenuBase.montant > 0);
    }

    if (isCreate) {
      empList.push(payload);
    } else {
      empList[editIndex] = { ...(empList[editIndex] || {}), ...payload };
    }

    pers[pIndex] = { ...(pers[pIndex] || {}), employeurs: empList };
    await updateDoc(ref, { personnes: pers });

    // Retour à la fiche "Informations" de la personne
    navigate(`/informations/${pIndex}/${id}`);
  };

  // -------- UI helpers --------
  const RadioBtn = ({ checked, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm ${
        checked ? "border-creditxblue text-creditxblue" : "border-gray-300 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  const TogglePill = ({ active, onClick, label }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border ${
        active ? "bg-creditxblue text-white border-creditxblue" : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      {label}
    </button>
  );

  const InfoEnd = ({ children }) => (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="font-medium mb-1">💡 FIN DU FORMULAIRE</div>
      <div>{children}</div>
    </div>
  );

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6 pb-20">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="text-2xl mb-6">←</button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <BusinessOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">
            {isCreate ? "Ajouter un employeur" : "Modifier l’employeur"}
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          {/* Activité */}
          <div>
            <div className="text-sm text-gray-600 mb-2">Activité *</div>
            <div className="flex gap-2">
              <RadioBtn
                checked={statutEntreprise === "independant"}
                onClick={() => {
                  setStatutEntreprise("independant");
                  // reset salarié
                  setSalaireIrreg(null);
                  setSalaireAncienneteOK(null);
                }}
                label="Indépendant"
              />
              <RadioBtn
                checked={statutEntreprise === "salarie"}
                onClick={() => {
                  setStatutEntreprise("salarie");
                  // reset indep
                  setIndep36Plus(null);
                }}
                label="Salarié"
              />
            </div>
          </div>

          {/* Branche Indépendant */}
          {statutEntreprise === "independant" && (
            <>
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Exercez-vous cette activité depuis plus de 36 mois ? *
                </div>
                <div className="flex gap-2">
                  <RadioBtn checked={indep36Plus === true} onClick={() => setIndep36Plus(true)} label="Oui" />
                  <RadioBtn checked={indep36Plus === false} onClick={() => setIndep36Plus(false)} label="Non" />
                </div>
              </div>

              {indep36Plus === false && (
                <InfoEnd>
                  Malheureusement, vous ne pouvez pas aller plus loin. En tant qu’indépendant,
                  vous devez avoir au moins 36 mois d’activité. Nous vous conseillons de vous
                  adresser directement à votre banque qui vous conseillera au mieux.
                </InfoEnd>
              )}

              {indep36Plus === true && (
                <div className="space-y-4">
                  {/* NEW: Raison sociale */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Nom de la raison sociale *</div>
                    <input
                      className="w-full rounded-xl border px-3 py-2"
                      value={raisonSociale}
                      onChange={(e) => setRaisonSociale(e.target.value)}
                      placeholder="Raison sociale / Nom commercial"
                    />
                  </div>

                  {/* NEW: Adresse */}
                <div>
                <div className="text-sm text-gray-600 mb-2">Adresse de la raison sociale *</div>
                <input
                    className="w-full rounded-xl border px-3 py-2"
                    value={adresseIndep}
                    onChange={(e) => setAdresseIndep(e.target.value)}
                    placeholder="Adresse et Localité"
                />
                {/* Tu brancheras l’API Google Adresse ici plus tard */}
                </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Revenu net annuel de l’année {anneeCourante - 1}
                    </div>
                    <input
                      inputMode="numeric"
                      placeholder="CHF 100’000"
                      className="w-full rounded-xl border px-3 py-2"
                      value={formatCHF(indepRevenuN1)}
                      onChange={(e) => setIndepRevenuN1(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Revenu net annuel de l’année {anneeCourante - 2}
                    </div>
                    <input
                      inputMode="numeric"
                      placeholder="CHF 100’000"
                      className="w-full rounded-xl border px-3 py-2"
                      value={formatCHF(indepRevenuN2)}
                      onChange={(e) => setIndepRevenuN2(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Revenu net annuel de l’année {anneeCourante - 3}
                    </div>
                    <input
                      inputMode="numeric"
                      placeholder="CHF 100’000"
                      className="w-full rounded-xl border px-3 py-2"
                      value={formatCHF(indepRevenuN3)}
                      onChange={(e) => setIndepRevenuN3(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Branche Salarié */}
          {statutEntreprise === "salarie" && (
            <>
              {/* Revenus irréguliers ? */}
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  Recevez-vous des revenus irréguliers (ex. commissions, etc.) ? *
                </div>
                <div className="flex gap-2">
                  <RadioBtn checked={salaireIrreg === true} onClick={() => setSalaireIrreg(true)} label="Oui" />
                  <RadioBtn checked={salaireIrreg === false} onClick={() => setSalaireIrreg(false)} label="Non" />
                </div>
              </div>

              {/* Garde-fous d'ancienneté selon irrégulier ou non */}
              {salaireIrreg !== null && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Exercez-vous cette activité depuis plus de {salaireIrreg ? "12" : "3"} mois ? *
                  </div>
                  <div className="flex gap-2">
                    <RadioBtn checked={salaireAncienneteOK === true} onClick={() => setSalaireAncienneteOK(true)} label="Oui" />
                    <RadioBtn checked={salaireAncienneteOK === false} onClick={() => setSalaireAncienneteOK(false)} label="Non" />
                  </div>
                </div>
              )}

              {showBlocFinSalIrr && (
                <InfoEnd>
                  Malheureusement, vous ne pouvez pas aller plus loin. En effet, vous devez avoir
                  au moins 12 mois d’activité. Nous vous conseillons de vous adresser directement
                  à votre banque qui vous conseillera au mieux.
                </InfoEnd>
              )}

              {showBlocFinSalReg && (
                <InfoEnd>
                  Malheureusement, vous ne pouvez pas aller plus loin. En effet, vous devez avoir
                  au moins 3 mois d’activité. Nous vous conseillons de vous adresser directement
                  à votre banque qui vous conseillera au mieux.
                </InfoEnd>
              )}

              {/* Formulaire salarié (si ancienneté OK) */}
              {salaireAncienneteOK === true && (
                <div className="space-y-5">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Nom de l’employeur *</div>
                    <input
                      className="w-full rounded-xl border px-3 py-2"
                      value={nomEmployeur}
                      onChange={(e) => setNomEmployeur(e.target.value)}
                      placeholder="Employeur SA"
                    />
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Adresse de l’employeur *</div>
                    <input
                      className="w-full rounded-xl border px-3 py-2"
                      value={adresseEmployeur}
                      onChange={(e) => setAdresseEmployeur(e.target.value)}
                      placeholder="Adresse et Localité"
                    />
                    {/* À remplacer par ton composant Adresse (Google) plus tard */}
                  </div>

                  {/* Revenu brut (hors bonus) */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Revenu brut (ne pas inclure le bonus) *</div>
                    <div className="flex items-center gap-2">
                      <TogglePill
                        active={revenuMode === "annuel"}
                        onClick={() => setRevenuMode("annuel")}
                        label="Annuel"
                      />
                      <TogglePill
                        active={revenuMode === "mensuel"}
                        onClick={() => setRevenuMode("mensuel")}
                        label="Mensuel"
                      />
                    </div>

                    {revenuMode === "mensuel" && (
                      <div className="flex items-center gap-2">
                        <TogglePill
                          active={frequenceMensuelle === 12}
                          onClick={() => setFrequenceMensuelle(12)}
                          label="12 x"
                        />
                        <TogglePill
                          active={frequenceMensuelle === 13}
                          onClick={() => setFrequenceMensuelle(13)}
                          label="13 x"
                        />
                      </div>
                    )}

                    <input
                      inputMode="numeric"
                      placeholder="CHF 100’000"
                      className="w-full rounded-xl border px-3 py-2"
                      value={formatCHF(revenuMontant)}
                      onChange={(e) => setRevenuMontant(e.target.value)}
                    />
                    {revenuAnnuelCalcule != null && (
                      <div className="text-xs text-gray-500">
                        Équivalent annuel: CHF {formatCHF(revenuAnnuelCalcule)}
                      </div>
                    )}
                  </div>

                  {/* Bonus */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Bonus *</div>
                    <div className="flex items-center gap-2">
                      <TogglePill
                        active={bonusActive === true}
                        onClick={() => setBonusActive(true)}
                        label="Oui"
                      />
                      <TogglePill
                        active={bonusActive === false}
                        onClick={() => setBonusActive(false)}
                        label="Non"
                      />
                    </div>

                    {bonusActive === true && (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            Montant du bonus en {anneeCourante}
                          </div>
                          <input
                            inputMode="numeric"
                            className="w-full rounded-xl border px-3 py-2"
                            placeholder="CHF 10’000"
                            value={formatCHF(bonusY)}
                            onChange={(e) => setBonusY(e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            Montant du bonus en {anneeCourante - 1}
                          </div>
                          <input
                            inputMode="numeric"
                            className="w-full rounded-xl border px-3 py-2"
                            placeholder="CHF 8’000"
                            value={formatCHF(bonusY1)}
                            onChange={(e) => setBonusY1(e.target.value)}
                          />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            Montant du bonus en {anneeCourante - 2}
                          </div>
                          <input
                            inputMode="numeric"
                            className="w-full rounded-xl border px-3 py-2"
                            placeholder="CHF 6’000"
                            value={formatCHF(bonusY2)}
                            onChange={(e) => setBonusY2(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 mb-10 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="tw px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            type="button"
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`tw px-4 py-2 rounded-xl text-white ${
              canSave ? "bg-creditxblue hover:opacity-90" : "bg-gray-300 cursor-not-allowed"
            }`}
            type="button"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
