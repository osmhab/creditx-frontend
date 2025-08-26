// src/DossierBien/CaracteristiquesBien.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import ModalMessage from "../../components/ModalMessage";
import BlocExemple from "../../components/BlocExemple";
import { Typography, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function CaracteristiquesBien() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeBien, setTypeBien] = useState(null); // affichage conditionnel

  // ===== Surfaces
  const [surfaceHabitableBrute, setSurfaceHabitableBrute] = useState("");
  const [surfaceHabitableNette, setSurfaceHabitableNette] = useState("");
  const [surfacePonderee, setSurfacePonderee] = useState("");

  // ===== Pièces
  const [nbPieces, setNbPieces] = useState("");
  const [nbChambres, setNbChambres] = useState("");

  // ===== Etages / ascenseur
  const [etage, setEtage] = useState("");
  const [etagesImmeuble, setEtagesImmeuble] = useState("");
  const [ascenseur, setAscenseur] = useState(null); // true/false

  // ===== Parkings
  const [parkInt, setParkInt] = useState("");
  const [parkExt, setParkExt] = useState("");
  const [parkInclus, setParkInclus] = useState(null);

  // ===== Nouveautés
  const [panneauxSolaires, setPanneauxSolaires] = useState(null); // true/false
  const [garagesBox, setGaragesBox] = useState(""); // nombre de box/garages
  const [surfaceTerrain, setSurfaceTerrain] = useState(""); // m²

  // ===== Etat / chauffage
  const [etatGeneral, setEtatGeneral] = useState(null);
  const [chauffage, setChauffage] = useState(null);
  const [anneeChauffage, setAnneeChauffage] = useState("");

  // ===== Cuisine / SDB
  const [amenagementCuisine, setAmenagementCuisine] = useState(null);
  const [coutMoyenSdb, setCoutMoyenSdb] = useState(null);

  // Liste dynamique des salles de bain (chaque item a un "type")
  // Valeurs possibles: "familiale" | "standard" | "wc_invite"
  const [sallesDeBain, setSallesDeBain] = useState([]); // ex: [{type:"standard"}, {type:"wc_invite"}]

  // ===== UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [openModalPonderee, setOpenModalPonderee] = useState(false);
  const [openModalBrute, setOpenModalBrute] = useState(false);
  const [openModalNette, setOpenModalNette] = useState(false);
  const [openModalEtages, setOpenModalEtages] = useState(false);
  const [openModalSolaires, setOpenModalSolaires] = useState(false);

  // 🔵 Nouveau : un seul modal pour les définitions SDB
  const [openModalSdbDefs, setOpenModalSdbDefs] = useState(false);

  // helpers
  const toIntOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const toFloatOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  // ===== chargement
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (!snap.exists() || !mounted) return;
        const data = snap.data() || {};
        const bien = data.bien || {};

        setTypeBien(bien.typeBien || null);

        setSurfaceHabitableBrute(bien.surfaceHabitableBrute ?? "");
        setSurfaceHabitableNette(bien.surfaceHabitableNette ?? "");
        // rétro‑compat : si anciens dossiers n’ont que "surfaceHabitable", on le met en brute
        if (!bien.surfaceHabitableBrute && bien.surfaceHabitable) {
          setSurfaceHabitableBrute(bien.surfaceHabitable);
        }
        setSurfacePonderee(bien.surfacePonderee ?? "");

        setNbPieces(bien.nbPieces ?? "");
        setNbChambres(bien.nbChambres ?? "");

        setEtage(bien.etage ?? "");
        setEtagesImmeuble(bien.etagesImmeuble ?? "");
        setAscenseur(typeof bien.ascenseur === "boolean" ? bien.ascenseur : null);

        setParkInt(bien.parkings?.interieur ?? "");
        setParkExt(bien.parkings?.exterieur ?? "");
        setParkInclus(
          typeof bien.parkings?.inclusDansPrix === "boolean" ? bien.parkings.inclusDansPrix : null
        );

        // nouveautés
        setPanneauxSolaires(
          typeof bien.panneauxSolaires === "boolean" ? bien.panneauxSolaires : null
        );
        setGaragesBox(bien.garagesBox ?? "");
        setSurfaceTerrain(bien.surfaceTerrain ?? "");

        setEtatGeneral(bien.etatGeneral ?? null);
        setChauffage(bien.chauffage ?? null);
        setAnneeChauffage(bien.anneeChauffage ?? "");

        setAmenagementCuisine(bien.amenagementCuisine ?? null);
        setCoutMoyenSdb(bien.coutMoyenSdb ?? null);

        // salles de bain
        const arr = Array.isArray(bien.sallesDeBain)
          ? bien.sallesDeBain
          : (bien.sallesDeBainTypes || []); // support éventuel ancien nom
        if (Array.isArray(arr) && arr.length > 0) {
          setSallesDeBain(arr.map((t) => ({ type: t })));
        } else {
          const details = bien.detailsSdb || {};
          const f = Math.max(0, details.familiale || 0);
          const s = Math.max(0, details.standard || 0);
          const w = Math.max(0, details.wcInvite || 0);
          const rebuilt = [
            ...Array(f).fill({ type: "familiale" }),
            ...Array(s).fill({ type: "standard" }),
            ...Array(w).fill({ type: "wc_invite" }),
          ];
          setSallesDeBain(rebuilt);
        }
      } catch (e) {
        console.error("Erreur chargement caractéristiques :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // ===== options
  const etatOptions = useMemo(
    () => [
      { value: "neuf", label: "Neuf / récent" },
      { value: "tres_bon", label: "Très bon" },
      { value: "bon", label: "Bon" },
      { value: "travaux", label: "Travaux à prévoir" },
    ],
    []
  );

  const chauffageOptions = useMemo(
    () => [
      { value: "pompe_a_chaleur", label: "Pompe à chaleur" },
      { value: "gaz", label: "Gaz" },
      { value: "mazout", label: "Mazout" },
      { value: "reseau_chaleur", label: "Réseau de chaleur" },
      { value: "electrique", label: "Électrique" },
      { value: "autre", label: "Autre" },
    ],
    []
  );

  const boolOptions = [
    { value: true, label: "Oui" },
    { value: false, label: "Non" },
  ];

  const cuisineOptions = useMemo(
    () => [
      { value: "simple", label: "Simple (≤ 20’000)" },
      { value: "standard", label: "Standard (20’000–40’000)" },
      { value: "haut_gamme", label: "Haut de gamme (40’000–60’000)" },
      { value: "premium", label: "Premium (> 60’000)" },
    ],
    []
  );

  const coutSdbOptions = useMemo(
    () => [
      { value: "simple", label: "Simple (≤ 10’000)" },
      { value: "standard", label: "Standard (10’000–30’000)" },
      { value: "haut_gamme", label: "Haut de gamme (30’000–50’000)" },
      { value: "premium", label: "Premium (> 50’000)" },
    ],
    []
  );

  const sdbTypeOptions = useMemo(
    () => [
      { value: "familiale", label: "Familiale" },
      { value: "standard", label: "Standard" },
      { value: "wc_invite", label: "WC invité" },
    ],
    []
  );

  // ===== validation — au moins brute OU nette, sinon autres fallback (pondérée ou pièces+chambres)
  const baseOk =
    (toFloatOrNull(surfaceHabitableBrute) > 0 ||
      toFloatOrNull(surfaceHabitableNette) > 0) ||
    toFloatOrNull(surfacePonderee) > 0 ||
    (toFloatOrNull(nbPieces) > 0 && toIntOrNull(nbChambres) > 0);

  const valid = baseOk;

  // ===== dérivés salles de bain
  const counts = sallesDeBain.reduce(
    (acc, it) => {
      if (it?.type === "familiale") acc.familiale += 1;
      else if (it?.type === "standard") acc.standard += 1;
      else if (it?.type === "wc_invite") acc.wcInvite += 1;
      return acc;
    },
    { familiale: 0, standard: 0, wcInvite: 0 }
  );
  const totalSdb = sallesDeBain.length;

  // ===== handlers SDB
  const addSalleDeBain = () => {
    setSallesDeBain((prev) => [...prev, { type: "standard" }]);
  };
  const updateSalleDeBain = (index, newType) => {
    setSallesDeBain((prev) =>
      prev.map((it, i) => (i === index ? { ...it, type: newType } : it))
    );
  };
  const removeSalleDeBain = (index) => {
    setSallesDeBain((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== save
  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const bien = { ...(data.bien || {}) };

      // surfaces
      bien.surfaceHabitableBrute = toFloatOrNull(surfaceHabitableBrute);
      bien.surfaceHabitableNette = toFloatOrNull(surfaceHabitableNette);
      bien.surfacePonderee = toFloatOrNull(surfacePonderee);

      // rétro‑compat : "surfaceHabitable" = meilleure dispo (nette > brute)
      const fallbackHab =
        toFloatOrNull(surfaceHabitableNette) ??
        toFloatOrNull(surfaceHabitableBrute) ??
        null;
      bien.surfaceHabitable = fallbackHab;

      // pièces
      bien.nbPieces = toFloatOrNull(nbPieces);
      bien.nbChambres = toIntOrNull(nbChambres);

      // spécifique immeuble/appartement
      bien.etage = toIntOrNull(etage);
      bien.etagesImmeuble = toIntOrNull(etagesImmeuble);
      if (ascenseur !== null) bien.ascenseur = ascenseur;

      // parkings
      bien.parkings = {
        interieur: toIntOrNull(parkInt),
        exterieur: toIntOrNull(parkExt),
        inclusDansPrix: parkInclus === null ? null : parkInclus,
      };

      // nouveautés
      bien.panneauxSolaires = panneauxSolaires === null ? null : panneauxSolaires;
      bien.garagesBox = toIntOrNull(garagesBox);
      bien.surfaceTerrain = toFloatOrNull(surfaceTerrain);

      // état / chauffage
      bien.etatGeneral = etatGeneral || null;
      bien.chauffage = chauffage || null;
      bien.anneeChauffage = toIntOrNull(anneeChauffage);

      // cuisine / sdb
      bien.amenagementCuisine = amenagementCuisine || null;
      bien.coutMoyenSdb = coutMoyenSdb || null;

      // sdb
      const typesArray = sallesDeBain.map((it) => it.type);
      bien.sallesDeBain = typesArray;
      bien.detailsSdb = { ...counts };
      bien.nbSdb = totalSdb;

      // rappel : ensoleillement / orientation / standing restent null (évalués plus tard par IA)

      await updateDoc(ref, { bien });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("Erreur sauvegarde caractéristiques :", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-base lg:text-sm">Chargement...</div>;

  const isAppartement = typeBien === "appartement";

  // Helpers UI pour inputs numériques (clavier numérique)
  const numPropsInt = { inputMode: "numeric", pattern: "[0-9]*" };
  const numPropsDec = { inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex justify-center px-4 pt-6">
      <div className="w-full max-w-md">
        <button onClick={() => navigate(`/bien/${id}`)} className="mb-4">
          <span className="text-xl">←</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-creditxblue text-white flex items-center justify-center">
            <TuneOutlinedIcon fontSize="small" />
          </div>
          <h1 className="text-xl font-semibold">Caractéristiques principales</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
          {/* Surfaces */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface habitable brute (m²) <span className="text-red-500">*</span>
                  <Tooltip title="Qu’est-ce que la surface brute ?">
                    <IconButton
                      size="small"
                      onClick={() => setOpenModalBrute(true)}
                      sx={{ color: "#0047FF", p: 0.5 }}
                    >
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfaceHabitableBrute}
                onChange={(e) => setSurfaceHabitableBrute(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface habitable nette (m²)
                  <Tooltip title="Qu’est-ce que la surface nette ?">
                    <IconButton
                      size="small"
                      onClick={() => setOpenModalNette(true)}
                      sx={{ color: "#0047FF", p: 0.5 }}
                    >
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfaceHabitableNette}
                onChange={(e) => setSurfaceHabitableNette(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
              {!(toFloatOrNull(surfaceHabitableBrute) > 0 || toFloatOrNull(surfaceHabitableNette) > 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  Indique au moins la surface <b>brute</b> ou la surface <b>nette</b>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Surface pondérée (m²)
                  <Tooltip title="Qu’est-ce que la surface pondérée ?">
                    <IconButton
                      size="small"
                      onClick={() => setOpenModalPonderee(true)}
                      sx={{ color: "#0047FF", p: 0.5 }}
                    >
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsDec}
                value={surfacePonderee}
                onChange={(e) => setSurfacePonderee(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Pièces */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Pièces</label>
              <input
                type="text"
                {...numPropsDec}
                value={nbPieces}
                onChange={(e) => setNbPieces(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Chambres</label>
              <input
                type="text"
                {...numPropsInt}
                value={nbChambres}
                onChange={(e) => setNbChambres(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Étage (appartement) + Nb étages immeuble (toujours) */}
          {isAppartement && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Étage</label>
                <input
                  type="text"
                  {...numPropsInt}
                  value={etage}
                  onChange={(e) => setEtage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  <span className="flex items-center gap-1">
                    Nb étages immeuble
                    <Tooltip title="Important">
                      <IconButton
                        size="small"
                        onClick={() => setOpenModalEtages(true)}
                        sx={{ color: "#0047FF", p: 0.5 }}
                      >
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </span>
                </label>
                <input
                  type="text"
                  {...numPropsInt}
                  value={etagesImmeuble}
                  onChange={(e) => setEtagesImmeuble(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {!isAppartement && (
            <div>
              <label className="block text-sm mb-1">
                <span className="flex items-center gap-1">
                  Nb étages immeuble (même pour une maison)
                  <Tooltip title="Important">
                    <IconButton
                      size="small"
                      onClick={() => setOpenModalEtages(true)}
                      sx={{ color: "#0047FF", p: 0.5 }}
                    >
                      <InfoOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </span>
              </label>
              <input
                type="text"
                {...numPropsInt}
                value={etagesImmeuble}
                onChange={(e) => setEtagesImmeuble(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          )}

          {isAppartement && (
            <SelecteurCreditX
              label="Ascenseur"
              value={ascenseur}
              onChange={setAscenseur}
              options={boolOptions}
              placeholder="Sélectionner"
              searchable={false}
              clearable
            />
          )}

          {/* Nouveautés */}
          <SelecteurCreditX
            label="Panneaux solaires"
            value={panneauxSolaires}
            onChange={setPanneauxSolaires}
            options={boolOptions}
            placeholder="Oui / Non"
            searchable={false}
            clearable
          />
          <div>
            <label className="block text-sm mb-1">
              <span className="flex items-center gap-1">
                Garage / box (nombre)
                <Tooltip title="Nombre de garages fermés ou box.">
                  <IconButton
                    size="small"
                    onClick={() => {}}
                    sx={{ color: "#0047FF", p: 0.5 }}
                  >
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </span>
            </label>
            <input
              type="text"
              {...numPropsInt}
              value={garagesBox}
              onChange={(e) => setGaragesBox(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              <span className="flex items-center gap-1">
                Surface du terrain (m²)
                <Tooltip title="Surface cadastrale du terrain.">
                  <IconButton
                    size="small"
                    onClick={() => {}}
                    sx={{ color: "#0047FF", p: 0.5 }}
                  >
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </span>
            </label>
            <input
              type="text"
              {...numPropsDec}
              value={surfaceTerrain}
              onChange={(e) => setSurfaceTerrain(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
          </div>

          {/* Cuisine / Coût SDB */}
          <SelecteurCreditX
            label="Aménagement de la cuisine"
            value={amenagementCuisine}
            onChange={setAmenagementCuisine}
            options={cuisineOptions}
            placeholder="Sélectionner"
            searchable={false}
            clearable
          />
          <SelecteurCreditX
            label="Coût moyen des salles de bain"
            value={coutMoyenSdb}
            onChange={setCoutMoyenSdb}
            options={coutSdbOptions}
            placeholder="Sélectionner"
            searchable={false}
            clearable
          />

          {/* Liste dynamique — Précision par salle de bain */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-medium">Précision par salle de bain</h2>
                {/* 🔵 Bouton i unique qui ouvre le modal regroupé */}
                <Tooltip title="Définitions des types de salle de bain">
                  <IconButton
                    size="small"
                    onClick={() => setOpenModalSdbDefs(true)}
                    sx={{ color: "#0047FF", p: 0.5 }}
                  >
                    <InfoOutlinedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="text-xs text-gray-500">
                Total: <span className="font-medium">{totalSdb}</span> • Familiale {counts.familiale} • Standard {counts.standard} • WC invité {counts.wcInvite}
              </div>
            </div>

            {sallesDeBain.length === 0 && (
              <p className="text-sm text-gray-500">Aucune salle de bain ajoutée pour l’instant.</p>
            )}

            <div className="space-y-2">
              {sallesDeBain.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SelecteurCreditX
                      label={`Salle de bain ${idx + 1}`}
                      value={item.type}
                      onChange={(v) => updateSalleDeBain(idx, v)}
                      options={sdbTypeOptions}
                      placeholder="Choisir le type"
                      searchable={false}
                      clearable={false}
                    />
                  </div>
                  <Tooltip title="Supprimer">
                    <IconButton
                      onClick={() => removeSalleDeBain(idx)}
                      size="small"
                      sx={{ color: "#ef4444" }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* ✅ plus d'icônes d'info par ligne */}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSalleDeBain}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-sm hover:bg-gray-50"
            >
              + Ajouter une salle de bain
            </button>
          </div>

          {/* Parkings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Parking int.</label>
              <input
                type="text"
                {...numPropsInt}
                value={parkInt}
                onChange={(e) => setParkInt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Parking ext.</label>
              <input
                type="text"
                {...numPropsInt}
                value={parkExt}
                onChange={(e) => setParkExt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Inclus dans le prix ?</label>
              <SelecteurCreditX
                value={parkInclus}
                onChange={setParkInclus}
                options={boolOptions}
                placeholder="Oui / Non"
                searchable={false}
                clearable
              />
            </div>
          </div>

          {/* État et chauffage */}
          <SelecteurCreditX
            label="État général"
            value={etatGeneral}
            onChange={setEtatGeneral}
            options={etatOptions}
            placeholder="Sélectionner l’état"
            searchable={false}
            clearable
          />
          <div className="grid grid-cols-2 gap-3">
            <SelecteurCreditX
              label="Type de chauffage"
              value={chauffage}
              onChange={setChauffage}
              options={chauffageOptions}
              placeholder="Sélectionner"
              searchable
              clearable
            />
            <div>
              <label className="block text-sm mb-1">Année chauffage</label>
              <input
                type="text"
                {...numPropsInt}
                value={anneeChauffage}
                onChange={(e) => setAnneeChauffage(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/bien/${id}`)}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!valid || saving}
              className={`px-4 py-2 rounded-xl text-white ${
                valid && !saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        {/* ===== Modals */}
        <ModalMessage
          open={openModalBrute}
          onClose={() => setOpenModalBrute(false)}
          onConfirm={() => setOpenModalBrute(false)}
          title="Surface habitable brute — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La <strong>surface habitable brute</strong> est la surface totale de l’appartement
                ou de la maison, avant toute déduction (incluant cloisons, murs intérieurs,
                gaines techniques).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br />
                Appartement au sol : 120 m²<br />
                Surface brute = <strong>120 m²</strong>
              </BlocExemple>
            </>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        <ModalMessage
          open={openModalNette}
          onClose={() => setOpenModalNette(false)}
          onConfirm={() => setOpenModalNette(false)}
          title="Surface habitable nette — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La <strong>surface habitable nette</strong> correspond à la surface brute diminuée
                des zones non utilisables (murs porteurs, cloisons épaisses, gaines techniques).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br />
                Surface brute : 120 m²<br />
                Murs + gaines : 15 m²<br />
                Surface nette ≈ <strong>105 m²</strong>
              </BlocExemple>
            </>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        <ModalMessage
          open={openModalPonderee}
          onClose={() => setOpenModalPonderee(false)}
          onConfirm={() => setOpenModalPonderee(false)}
          title="Surface pondérée — explication"
          message={
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                La <strong>surface pondérée</strong> est une surface “corrigée” utilisée par
                les banques et les experts pour l’évaluation. Elle additionne la surface
                habitable avec certaines surfaces annexes en leur appliquant des coefficients
                (ex. balcon, terrasse, cave, combles, etc.).
              </Typography>
              <BlocExemple>
                <em>Exemple :</em><br />
                Habitable : 100 m²<br />
                Balcon : 20 m² (coeff. 50 % → 10)<br />
                Cave : 10 m² (coeff. 25 % → 2.5)<br />
                <strong>Total pondéré ≈ 112.5 m²</strong>
              </BlocExemple>
              <Typography
                variant="caption"
                sx={{ display: "block", color: "#6b7280", fontStyle: "italic" }}
              >
                Si vous ne l’avez pas, laissez le champ vide — nous pourrons l’estimer plus tard.
              </Typography>
            </>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        <ModalMessage
          open={openModalEtages}
          onClose={() => setOpenModalEtages(false)}
          onConfirm={() => setOpenModalEtages(false)}
          title="Nombre d’étages de l’immeuble"
          message={
            <Typography variant="body1">
              <strong>Ne pas compter le rez‑de‑chaussée.</strong> Indiquez uniquement les étages
              supérieurs (ex. 1er, 2e, 3e...). Si l’immeuble a 4 niveaux au‑dessus du rez,
              entrez <strong>4</strong>.
            </Typography>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        {/* 🔵 Modal unique — Définitions des SDB */}
        <ModalMessage
          open={openModalSdbDefs}
          onClose={() => setOpenModalSdbDefs(false)}
          onConfirm={() => setOpenModalSdbDefs(false)}
          title="Définitions — salles de bain"
          message={
            <div className="space-y-3">
              <Typography variant="body1">
                <strong>Familiale</strong> : baignoire <em>et</em> cabine de douche + lavabo + WC.
              </Typography>
              <Typography variant="body1">
                <strong>Standard</strong> : baignoire <em>ou</em> douche + lavabo + WC.
              </Typography>
              <Typography variant="body1">
                <strong>WC invité</strong> : lavabo + WC (sans baignoire ni douche).
              </Typography>
            </div>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />

        <ModalMessage
          open={openModalSolaires}
          onClose={() => setOpenModalSolaires(false)}
          onConfirm={() => setOpenModalSolaires(false)}
          title="Panneaux solaires — info"
          message={
            <Typography variant="body1">
              Cochez <strong>Oui</strong> si une installation photovoltaïque ou solaire thermique
              est présente (toit, façade ou au sol). Si vous hésitez, laissez <em>Non</em> ou vide.
            </Typography>
          }
          confirmText="Compris"
          onlyConfirm
          showCloseIcon
          iconType="knowledge"
        />
      </div>
    </div>
  );
}
