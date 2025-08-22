// src/DossierBien/CaracteristiquesBien.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import ModalMessage from "../../components/ModalMessage";
import BlocExemple from "../../components/BlocExemple";
import { Typography } from "@mui/material";
import { Box, Button, TextField, Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";




export default function CaracteristiquesBien() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [typeBien, setTypeBien] = useState(null); // pour affichage conditionnel
  const [surfaceHabitable, setSurfaceHabitable] = useState("");
  const [surfacePonderee, setSurfacePonderee] = useState("");
  const [nbPieces, setNbPieces] = useState("");
  const [nbChambres, setNbChambres] = useState("");
  const [nbSdb, setNbSdb] = useState("");
  const [etage, setEtage] = useState("");
  const [etagesImmeuble, setEtagesImmeuble] = useState("");
  const [ascenseur, setAscenseur] = useState(null); // true/false
  const [parkInt, setParkInt] = useState("");
  const [parkExt, setParkExt] = useState("");
  const [parkInclus, setParkInclus] = useState(null);
  const [etatGeneral, setEtatGeneral] = useState(null);
  const [chauffage, setChauffage] = useState(null);
  const [anneeChauffage, setAnneeChauffage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [openModalPonderee, setOpenModalPonderee] = useState(false);


  // helpers
  const toIntOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toFloatOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // chargement
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        if (!snap.exists() || !mounted) return;
        const data = snap.data() || {};
        const bien = data.bien || {};

        setTypeBien(bien.typeBien || null);
        setSurfaceHabitable(bien.surfaceHabitable ?? "");
        setSurfacePonderee(bien.surfacePonderee ?? "");
        setNbPieces(bien.nbPieces ?? "");
        setNbChambres(bien.nbChambres ?? "");
        setNbSdb(bien.nbSdb ?? "");
        setEtage(bien.etage ?? "");
        setEtagesImmeuble(bien.etagesImmeuble ?? "");
        setAscenseur(
          typeof bien.ascenseur === "boolean" ? bien.ascenseur : null
        );
        setParkInt(bien.parkings?.interieur ?? "");
        setParkExt(bien.parkings?.exterieur ?? "");
        setParkInclus(
          typeof bien.parkings?.inclusDansPrix === "boolean"
            ? bien.parkings.inclusDansPrix
            : null
        );
        setEtatGeneral(bien.etatGeneral ?? null);
        setChauffage(bien.chauffage ?? null);
        setAnneeChauffage(bien.anneeChauffage ?? "");
      } catch (e) {
        console.error("Erreur chargement caractéristiques :", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // options
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

  // validation minimale (une surface OU (pièces + chambres))
  const baseOk =
    toFloatOrNull(surfaceHabitable) > 0 ||
    toFloatOrNull(surfacePonderee) > 0 ||
    (toFloatOrNull(nbPieces) > 0 && toIntOrNull(nbChambres) > 0);

  const valid = baseOk; // le reste peut rester optionnel ici

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const bien = { ...(data.bien || {}) };

      bien.surfaceHabitable = toFloatOrNull(surfaceHabitable);
      bien.surfacePonderee = toFloatOrNull(surfacePonderee);
      bien.nbPieces = toFloatOrNull(nbPieces);
      bien.nbChambres = toIntOrNull(nbChambres);
      bien.nbSdb = toIntOrNull(nbSdb);

      // spécifiques immeuble/appartement
      bien.etage = toIntOrNull(etage);
      bien.etagesImmeuble = toIntOrNull(etagesImmeuble);
      if (ascenseur !== null) bien.ascenseur = ascenseur;

      // parkings
      bien.parkings = {
        interieur: toIntOrNull(parkInt),
        exterieur: toIntOrNull(parkExt),
        inclusDansPrix: parkInclus === null ? null : parkInclus,
      };

      // état / chauffage
      bien.etatGeneral = etatGeneral || null;
      bien.chauffage = chauffage || null;
      bien.anneeChauffage = toIntOrNull(anneeChauffage);

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

        <div className="bg-white rounded-2xl p-4 space-y-5">
          {/* Surfaces / pièces */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Surface habitable (m²)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={surfaceHabitable}
                onChange={(e) => setSurfaceHabitable(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
  <label className="block text-sm mb-1">
    <span className="flex items-center gap-1">
      Surface pondérée (m²)
      <Tooltip title="Qu’est‑ce que c’est ?">
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
    type="number"
    min="0"
    step="0.1"
    value={surfacePonderee}
    onChange={(e) => setSurfacePonderee(e.target.value)}
    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
  />
</div>


          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Pièces</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={nbPieces}
                onChange={(e) => setNbPieces(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Chambres</label>
              <input
                type="number"
                min="0"
                step="1"
                value={nbChambres}
                onChange={(e) => setNbChambres(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Salles d’eau</label>
              <input
                type="number"
                min="0"
                step="1"
                value={nbSdb}
                onChange={(e) => setNbSdb(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {/* Spécifique appartements / immeubles */}
          {isAppartement && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Étage</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={etage}
                    onChange={(e) => setEtage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Nb étages immeuble</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={etagesImmeuble}
                    onChange={(e) => setEtagesImmeuble(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <SelecteurCreditX
                label="Ascenseur"
                value={ascenseur}
                onChange={setAscenseur}
                options={boolOptions}
                placeholder="Sélectionner"
                searchable={false}
                clearable
              />
            </>
          )}

          {/* Parkings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Parking int.</label>
              <input
                type="number"
                min="0"
                step="1"
                value={parkInt}
                onChange={(e) => setParkInt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Parking ext.</label>
              <input
                type="number"
                min="0"
                step="1"
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
                type="number"
                min="1800"
                max={new Date().getFullYear() + 1}
                step="1"
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
  showCancel={false}
  onlyConfirm
  showCloseIcon
  iconType="knowledge"
/>

      </div>
    </div>
  );
}
