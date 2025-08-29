// src/DossierBien/BienHub.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import LogoCreditXBlack from "../../assets/logo-creditx-black.svg";
import ModalMessage from "../../components/ModalMessage"; // ✅ utilise ton composant modal

// Couleur brand
const CREDITX_BLUE = "#001BFF";

// ---- Helpers ----
const isFilled = (v) => v !== undefined && v !== null && v !== "";

const formatValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.length ? val.join(", ") : null;
  if (typeof val === "object") {
    const { formatted, route, streetNumber, postalCode, locality } = val || {};
    const line1 = route && streetNumber ? `${streetNumber} ${route}` : route;
    const line2 = [postalCode, locality].filter(Boolean).join(" ");
    const txt = formatted || [line1, line2].filter(Boolean).join(", ");
    return txt || null;
  }
  return null;
};

// Règle de complétude côté Bien (badge d’état)
function computeEtatBien(bien) {
  if (!bien) return "Action requise";

  const adr = bien.adresse || bien.adresseFormatted;
  const adrOK = !!(adr && (typeof adr === "string" ? adr.trim() : true));
  const typeOK = !!bien.typeBien;
  const usageOK = !!bien.usage;
  const prixOK = typeof bien.prixAchat === "number" && bien.prixAchat > 0;

  const carOK =
    (typeof bien.surfaceHabitable === "number" && bien.surfaceHabitable > 0) ||
    (typeof bien.surfacePonderee === "number" && bien.surfacePonderee > 0) ||
    ((typeof bien.nbPieces === "number" && bien.nbPieces > 0) &&
      (typeof bien.nbChambres === "number" && bien.nbChambres > 0));

  const ppe = bien.ppe || {};
  const isApp = String(bien.typeBien || "").toLowerCase().includes("appartement");
  const ppeRequise = ppe.estPPE === false ? false : (isApp || ppe.estPPE === true);
  const ppeOK = !ppeRequise || (ppe.chargesMensuelles != null && ppe.nbLots != null);

  const occ = bien.occupation || {};
  const occOK = !!occ.type;
  const remiseOK = !!bien.remiseCles;

  // Critère bloquant interne si valeur bancaire < 85% prix d'achat
  if (
    bien.estimationCreditX?.valeurBancaire &&
    bien.prixAchat &&
    bien.estimationCreditX.valeurBancaire < 0.85 * bien.prixAchat
  ) {
    return "Critère bloquant";
  }

  if (adrOK && typeOK && usageOK && prixOK && carOK && ppeOK && occOK && remiseOK) {
    return "Terminé";
  }
  return "Action requise";
}

// Spinner minimal (pour le bouton)
const Spinner = ({ className = "h-4 w-4" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
  </svg>
);

export default function BienHub() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const bien = useMemo(() => demande?.bien || {}, [demande]);

  // --- Estimation state ---
  const [estimating, setEstimating] = useState(false);
  const [estimation, setEstimation] = useState(null); // { valeurMarche, valeurBancaire, date }
  const [estError, setEstError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [modalAck, setModalAck] = useState(false); // “J'ai compris” cliqué ?

  // Upsell / Lock modals
  const [showUpsell, setShowUpsell] = useState(false);
  const [showLocked, setShowLocked] = useState(false);

  // SSE refs
  const esRef = useRef(null);
  const finishedRef = useRef(false);

  // Gating primitives
  const adrVal = bien?.adresse || bien?.adresseFormatted;
  const adrOK = !!(adrVal && (typeof adrVal === "string" ? adrVal.trim() : true));
  const typeUsageOK = !!bien?.typeBien && !!bien?.usage;
  const prixOK = typeof bien?.prixAchat === "number" && bien?.prixAchat > 0;

  // État "calculé" => si on a déjà une estimation (Firestore) ou locale
  const isCalculated = !!(bien?.estimationCreditX || estimation);


  // Empêche la fermeture du modal d’estimation pendant le calcul
const handleCloseEstimationModal = () => {
  if (!estimating) setModalAck(true);
};
const handleConfirmEstimationModal = handleCloseEstimationModal;

// Contenu JSX pour le modal d’estimation (message ou progression)
const EstimationModalContent = () => {
  if (estimating) {
    return (
      <div className="text-left">
        <div className="flex items-center justify-center mb-3">
          <img src={LogoCreditXBlack} alt="CreditX" className="h-8" />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Analyse des données du bien…</span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full bg-black transition-all"
            style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 text-center">
          L'estimation peut prendre plusieurs minutes. Merci de patienter. Ne fermez pas cette fenêtre.
        </p>
      </div>
    );
  }

  // Après estimation : uniquement le message "Écart..." (pas de chiffres, pas de %)
  const info = getEcartInfo?.();
  const Block = ({ cls, title, text }) => (
    <div className={`mt-1 p-3 rounded-xl border text-sm ${cls}`}>
      <p className="font-medium mb-1">{title}</p>
      <p>{text}</p>
    </div>
  );

  if (!info) {
    return (
      <Block
        cls="bg-green-50 border-green-200 text-green-700"
        title="Calcul de valeur terminé"
        text="Aucun écart significatif détecté."
      />
    );
  }
  if (info.level === "critique") {
    return (
      <Block
        cls="bg-red-50 border-red-200 text-red-800"
        title="Critique mais non bloquant"
        text="La valeur reconnue par les banques apparaît sensiblement inférieure au prix d’achat. Nous recommandons un examen approfondi (conditions, apport, négociation du prix)."
      />
    );
  }
  if (info.level === "alerte") {
    return (
      <Block
        cls="bg-amber-50 border-amber-200 text-amber-800"
        title="Écart de valeur détecté"
        text="La valeur reconnue par les banques paraît inférieure au prix d’achat. Cela peut influencer les conditions de financement."
      />
    );
  }
  if (info.level === "faible") {
    return (
      <Block
        cls="bg-gray-50 border-gray-200 text-gray-700"
        title="Faible écart de valeur détecté"
        text="La valeur reconnue par les banques semble légèrement inférieure au prix d’achat. Point à garder en tête."
      />
    );
  }
  return (
    <Block
      cls="bg-green-50 border-green-200 text-green-700"
      title="Calcul de valeur terminé"
      text="Aucun écart significatif détecté."
    />
  );
};


  // Charger la demande
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (snap.exists() && mounted) setDemande({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error("Erreur de chargement du dossier bien :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
    };
  }, [id]);

  // Recalcul de l'état global du bien (hors libellé "Calculé" géré en UI)
  useEffect(() => {
    if (!demande) return;
    const nextEtat = computeEtatBien(bien);
    if (demande.etatBien !== nextEtat) {
      (async () => {
        try {
          await updateDoc(doc(db, "demandes", demande.id), { etatBien: nextEtat });
          setDemande((prev) => ({ ...prev, etatBien: nextEtat }));
        } catch (e) {
          console.error("Impossible de mettre à jour etatBien :", e);
        }
      })();
    }
  }, [demande, bien]);

  // Rendu d'une ligne de menu (verrouillée si calculé)
  const renderLigne = (label, value, path) => {
    const val = formatValue(value);
    const isEmpty = !val;

    const handleClick = () => {
      if (isCalculated) {
        setShowLocked(true);
        return;
      }
      if (path) navigate(path);
    };

    return (
      <div
        onClick={path ? handleClick : undefined}
        className={`flex justify-between items-center px-4 py-3 ${
          path ? (isCalculated ? "cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer") : ""
        } ${isCalculated ? "opacity-60" : ""}`}
      >
        <div>
          <p className="text-base lg:text-sm text-black">{label}</p>
          <p
            className={`text-base lg:text-sm ${
              isEmpty ? "text-[#FF5C02]" : path ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {isEmpty ? "Non renseigné" : val}
          </p>
        </div>
        {path && !isCalculated && <div className="text-gray-300">›</div>}
      </div>
    );
  };

  // Résumés d'affichage
  const resumeSurfaces = (() => {
    const arr = [];
    if (isFilled(bien.surfaceHabitable)) arr.push(`${bien.surfaceHabitable} m² hab.`);
    else if (isFilled(bien.surfaceHabitableBrute)) arr.push(`${bien.surfaceHabitableBrute} m² brute`);
    else if (isFilled(bien.surfaceHabitableNette)) arr.push(`${bien.surfaceHabitableNette} m² nette`);
    if (isFilled(bien.surfacePonderee)) arr.push(`${bien.surfacePonderee} m² pond.`);
    if (isFilled(bien.nbPieces)) arr.push(`${bien.nbPieces} pces`);
    if (isFilled(bien.nbChambres)) arr.push(`${bien.nbChambres} ch.`);
    return arr.join(" • ") || null;
  })();

  const resumeSdbCuisine = (() => {
    const details = bien.detailsSdb || {};
    const total = Number(bien.nbSdb) || 0;
    const parts = [];
    if (total) parts.push(`SDB ${total}`);
    const f = details.familiale || 0, s = details.standard || 0, w = details.wcInvite || 0;
    if (f || s || w) parts.push(`(F${f}/S${s}/WC${w})`);
    if (bien.coutMoyenSdb) parts.push(`Coût ${String(bien.coutMoyenSdb).replaceAll("_"," ")}`);
    if (bien.amenagementCuisine) parts.push(`Cuisine ${String(bien.amenagementCuisine).replaceAll("_"," ")}`);
    return parts.join(" • ") || null;
  })();

  const resumeEtagesPk = (() => {
    const isAppLocal = String(bien.typeBien || "").toLowerCase().includes("appartement");
    const parts = [];
    if (isAppLocal && isFilled(bien.etage)) parts.push(`Étage ${bien.etage}`);
    if (isFilled(bien.etagesImmeuble)) parts.push(`${bien.etagesImmeuble} étages immeuble`);
    if (isAppLocal && typeof bien.ascenseur === "boolean")
      parts.push(`Ascenseur ${bien.ascenseur ? "oui" : "non"}`);
    const pi = bien.parkings?.interieur ?? null;
    const pe = bien.parkings?.exterieur ?? null;
    if (isFilled(pi) || isFilled(pe)) parts.push(`Pk int ${pi || 0} / ext ${pe || 0}`);
    return parts.join(" • ") || null;
  })();

  const resumeEtatEnergie = (() => {
    const parts = [];
    if (bien.etatGeneral) parts.push(`État ${String(bien.etatGeneral).replaceAll("_"," ")}`);
    if (bien.chauffage) parts.push(`Chauffage ${String(bien.chauffage).replaceAll("_"," ")}`);
    if (isFilled(bien.anneeChauffage)) parts.push(`Année ${bien.anneeChauffage}`);
    if (typeof bien.panneauxSolaires === "boolean") parts.push(`Solaires ${bien.panneauxSolaires ? "oui" : "non"}`);
    if (isFilled(bien.garagesBox)) parts.push(`Garage/box ${bien.garagesBox}`);
    if (isFilled(bien.surfaceTerrain)) parts.push(`Terrain ${bien.surfaceTerrain} m²`);
    return parts.join(" • ") || null;
  })();

  // Affichages rapides
  const isAppartement = String(bien.typeBien || "").toLowerCase().includes("appartement");
  const showPPE = (isAppartement || bien.ppe?.estPPE === true) && bien.ppe?.estPPE !== false;

  const ligneAdresse = bien.adresse || bien.adresseFormatted || null;
  const ligneTypeUsage = [
    bien.typeBien ? String(bien.typeBien).replaceAll("_", " ") : null,
    bien.usage ? String(bien.usage).replaceAll("_", " ") : null,
  ].filter(Boolean).join(" • ");
  const lignePrix = isFilled(bien.prixAchat) ? `${Number(bien.prixAchat).toLocaleString("fr-CH")} CHF` : null;
  const lignePPE = (() => {
    const ppe = bien.ppe || {};
    if (ppe?.estPPE === false) return "PPE : Non";
    const parts = [];
    if (isFilled(ppe.chargesMensuelles)) {
      parts.push(`Charges: ${Number(ppe.chargesMensuelles).toLocaleString("fr-CH")} CHF/mois`);
    }
    if (isFilled(ppe.nbLots)) {
      parts.push(`Lots: ${ppe.nbLots}`);
    }
    return parts.join(" • ") || "Non renseigné";
  })();
  const occLabel = (t) => String(t).replaceAll("_", " ");
  const ligneOcc = bien.occupation?.type
    ? `${occLabel(bien.occupation.type)}${bien.remiseCles ? " • " + bien.remiseCles : ""}`
    : null;

  // --- Estimation via SSE + Modal ---
  const handleEstimer = async () => {
    try {
      setEstError(null);
      setEstimating(true);
      setEstimation(null);
      setProgress(0);
      setModalAck(false);
      finishedRef.current = false;

      if (esRef.current) { esRef.current.close(); esRef.current = null; }

      const qs = new URLSearchParams({ formData: JSON.stringify(bien) }).toString();
      const es = new EventSource(`/api/estimation/stream?${qs}`);
      esRef.current = es;

      es.addEventListener("progress", (e) => {
        try {
          const { percent } = JSON.parse(e.data);
          setProgress(Math.max(0, Math.min(100, Number(percent) || 0)));
        } catch {}
      });

      es.addEventListener("done", async (e) => {
        try {
          const data = JSON.parse(e.data);
          const result = {
            valeurMarche: Number(data.valeurMarche) || null,
            valeurBancaire: Number(data.valeurBancaire) || null,
            date: new Date().toISOString(),
          };
          finishedRef.current = true;
          setProgress(100);
          setEstimation(result);

          await updateDoc(doc(db, "demandes", demande.id), {
            bien: { ...bien, estimationCreditX: result },
          });
          setDemande((prev) => ({ ...prev, bien: { ...bien, estimationCreditX: result } }));
        } catch (err) {
          console.error("done event parse error:", err);
          setEstError("Erreur pendant l’interprétation du résultat.");
        } finally {
          es.close(); esRef.current = null; setEstimating(false);
        }
      });

      es.addEventListener("error", (e) => {
        const isClosed = es.readyState === EventSource.CLOSED;
        if (finishedRef.current || (isClosed && progress >= 99)) {
          es.close(); esRef.current = null; setEstimating(false);
          return;
        }
        console.error("SSE error", e);
        setEstError("Erreur pendant le calcul de l’estimation.");
        es.close(); esRef.current = null; setEstimating(false);
      });
    } catch (e) {
      console.error("Estimation error:", e);
      setEstError("Connexion au serveur impossible ou erreur de calcul.");
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setEstimating(false);
    }
  };

  // --- UI: calcul de l'écart (valeur bancaire vs prix d'achat)
  const getEcartInfo = () => {
    const prix = Number(bien.prixAchat) || 0;
    const vb = Number((bien?.estimationCreditX || estimation)?.valeurBancaire);
    if (!prix || !Number.isFinite(vb)) return null;
    const ecart = Math.max(0, ((prix - vb) / prix) * 100);

    let level = "ok";
    if (ecart >= 15) level = "critique";
    else if (ecart >= 6) level = "alerte";
    else if (ecart >= 1) level = "faible";
    else level = "ok";
    return { ecart, level };
  };

  // --- Gating rules (affichage progressif)
  const gates = {
    adresse: { enabled: true },
    typeUsage: { enabled: adrOK },
    prix: { enabled: adrOK && typeUsageOK },
    reste: { enabled: adrOK && typeUsageOK && prixOK },
  };

  // Modal visible pendant le calcul OU après (tant que non “J’ai compris”)
  const showModal = estimating || (!!(bien?.estimationCreditX || estimation) && !modalAck);

    // === Badge d’état (PLACE ICI, une seule fois) ===
  const BadgeEtat = ({ isCalculated, etatBien }) => {
    if (isCalculated) {
      return (
        <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "#E8F0FF", color: "#2049B0" }}>
          Calculé
        </span>
      );
    }
    if (etatBien === "Terminé") {
      return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">Terminé</span>;
    }
    if (etatBien === "Critère bloquant") {
      return <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700">Critère bloquant</span>;
    }
    return <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700">Action requise</span>;
  };
  

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;
  if (!demande) return <div className="p-6 text-base lg:text-sm">Demande introuvable.</div>;

  


  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/dashboard")} className="text-2xl lg:text-xl mb-6">←</button>

        <h1 className="text-2xl lg:text-xl font-bold">Informations sur le bien</h1>
        <p className="text-base lg:text-sm text-gray-500 mb-6">
          Renseignez les éléments clés du bien à financer.
        </p>

        <div className="bg-white rounded-xl divide-y">
          {renderLigne("Adresse du bien", ligneAdresse, `/bien/${id}/adresse`)}
          {renderLigne("Type & usage", ligneTypeUsage || null, gates.typeUsage.enabled ? `/bien/${id}/type-usage` : null)}
          {renderLigne("Prix & financement", lignePrix || null, gates.prix.enabled ? `/bien/${id}/prix` : null)}
          {gates.reste.enabled && (
            <>
              {renderLigne("Caractéristiques — Surfaces & pièces", resumeSurfaces, `/bien/${id}/caracteristiques/surfaces`)}
              {renderLigne("Caractéristiques — SDB & cuisine", resumeSdbCuisine, `/bien/${id}/caracteristiques/sdb-cuisine`)}
              {renderLigne("Caractéristiques — Étages & parkings", resumeEtagesPk, `/bien/${id}/caracteristiques/etages-parkings`)}
              {renderLigne("Caractéristiques — État, chauffage & énergie", resumeEtatEnergie, `/bien/${id}/caracteristiques/etat-chauffage-energie`)}
              {showPPE && renderLigne("Copropriété (PPE)", lignePPE, `/bien/${id}/ppe`)}
              {renderLigne("Occupation & disponibilité", ligneOcc || null, `/bien/${id}/occupation`)}
            </>
          )}
        </div>

        {/* Prochaine étape (guidage doux) */}
        {!gates.typeUsage.enabled && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 text-sm text-orange-800">
            Prochaine étape : renseigner <span className="font-medium">Type & usage</span>.
          </div>
        )}
        {gates.typeUsage.enabled && !gates.prix.enabled && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 text-sm text-orange-800">
            Prochaine étape : renseigner <span className="font-medium">Prix & financement</span>.
          </div>
        )}
        {gates.prix.enabled && !gates.reste.enabled && (
          <div className="mt-4 p-3 rounded-lg bg-orange-50 text-sm text-orange-800">
            Prochaine étape : compléter <span className="font-medium">Caractéristiques</span>.
          </div>
        )}

        

        {/* Feedback estimation (sur la page, sans chiffres) */}
        {estError && !estimating && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 text-sm text-red-700">{estError}</div>
        )}

        {!estimating && isCalculated && (() => {
          const info = getEcartInfo();
          if (!info) return null;

          

          const card = (cls, title, text) => (
  <div className={`mt-4 p-4 rounded-xl border text-sm ${cls}`}>
    <div className="flex items-center justify-between mb-1">
      <p className="font-medium">{title}</p>
      <BadgeEtat isCalculated={isCalculated} etatBien={demande?.etatBien} />
    </div>
    <p>{text}</p>
  </div>
);



          if (info.level === "critique") {
            return card("bg-red-50 border-red-200 text-red-800",
              "Critique mais non bloquant",
              "La valeur reconnue par les banques apparaît sensiblement inférieure au prix d’achat. Nous recommandons un examen approfondi (conditions, apport, négociation du prix)."
            );
          }
          if (info.level === "alerte") {
            return card("bg-amber-50 border-amber-200 text-amber-800",
              "Écart de valeur détecté",
              "La valeur reconnue par les banques est inférieure au prix d’achat. Cela peut influencer les conditions de financement."
            );
          }
          if (info.level === "faible") {
            return card("bg-gray-50 border-gray-200 text-gray-700",
              "Faible écart de valeur détecté",
              "La valeur reconnue par les banques est légèrement inférieure au prix d’achat. Point à garder en tête."
            );
          }
          return card("bg-green-50 border-green-200 text-green-700",
            "Calcul de valeur terminé",
            "Aucun écart significatif détecté."
          );
        })()}

        {/* Bouton principal (Estimer / Continuer) */}
        {adrOK && typeUsageOK && prixOK && (
          isCalculated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full mt-4 rounded-full py-3 text-sm font-medium bg-black text-white hover:bg-gray-900"
            >
              Continuer
            </button>
          ) : (
            <button
              onClick={handleEstimer}
              className="w-full mt-4 rounded-full py-3 text-sm font-medium bg-black text-white hover:bg-gray-900 disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={estimating}
            >
              {estimating ? (
                <>
                  <Spinner />
                  Calcul de l’estimation… {Math.round(progress)}%
                </>
              ) : (
                "Estimer la valeur du bien"
              )}
            </button>
          )
        )}

        {/* Bouton bleu: Voir l’estimation en détail (ouvre upsell) */}
        {isCalculated && (
          <button
            onClick={() => setShowUpsell(true)}
            className="w-full mt-3 rounded-full py-3 text-sm font-medium text-white hover:opacity-95"
            style={{ backgroundColor: CREDITX_BLUE }}
          >
            Voir l’estimation en détail
          </button>
          
        )}
    
      </div>
    

      {/* === MODAL ESTIMATION (ModaleMessage) === */}
      <ModalMessage
  open={showModal}
  onClose={handleCloseEstimationModal}          // ignoré si estimating = true
  onConfirm={handleConfirmEstimationModal}      // “J’ai compris” => setModalAck(true)
  title={estimating ? "Estimation en cours" : "Estimation terminée"}
  message={<EstimationModalContent />}          // JSX défini plus haut
  confirmText={
    estimating ? (
      <div className="flex items-center justify-center gap-2">
        <Spinner className="h-4 w-4" />
        Estimation en cours…
      </div>
    ) : (
      "J’ai compris"
    )
  }
  confirmDisabled={estimating}                  // ⬅️ bloque le clic tant que ça calcule
  showCancel={false}
  onlyConfirm
  showCloseIcon={false}
  showIcon={false}                              // on garde le branding dans le message
  maxWidth="sm"
  paperSx={{ textAlign: 'left' }}

/>



      {/* === MODAL LOCKED (ModaleMessage) === */}
      <ModalMessage
  open={showLocked}
  onClose={() => setShowLocked(false)}
  onConfirm={() => { setShowLocked(false); setShowUpsell(true); }}
  title="Votre bien a déjà été calculé"
  message={
    <div className="text-left">
      <p className="text-sm text-gray-600">
        La modification des informations n’est plus disponible après le calcul.
        Vous pouvez consulter votre estimation détaillée ou passer à la suite.
      </p>
    </div>
  }
  confirmText="Voir en détail"
  cancelText="Fermer"
  showCancel
  showCloseIcon
  iconType="info"
  maxWidth="sm"
/>


      {/* === MODAL UPSELL CHF 19.– (ModaleMessage) === */}
      <ModalMessage
  open={showUpsell}
  onClose={() => setShowUpsell(false)}
  onConfirm={() => {
    // TODO: branche ta route de paiement ici
    // ex: navigate(`/checkout/estimation?demandeId=${id}`)
    setShowUpsell(false);
  }}
  title="Débloquez votre estimation complète"
  message={
    <div className="text-left">
      <div className="flex items-center justify-center mb-3">
        <img src={LogoCreditXBlack} alt="CreditX" className="h-8" />
      </div>
      <p className="text-sm text-gray-700">
        Accédez aux montants détaillés reconnus par les banques, ainsi qu’au rapport complet.
      </p>
      <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-1">
        <li>Valeur marché & valeur bancaire (chiffres exacts)</li>
        <li>Écart vs prix d’achat et recommandations</li>
        <li>Export PDF pour votre dossier</li>
      </ul>
      <div className="mt-4 text-sm">
        <span className="text-gray-500">Tarif</span> <span className="font-semibold">CHF 19.–</span>
      </div>
    </div>
  }
  confirmText="Découvrez votre estimation"
  cancelText="Plus tard"
  showCancel
  showCloseIcon
  iconType="rocket"
  maxWidth="sm"
/>

    </div>
  );
}
