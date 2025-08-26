import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase-config";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SelecteurCreditX from "../../components/SelecteurCreditX";
import { Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ModalMessage from "../../components/ModalMessage";
import { Typography } from "@mui/material";

export default function CaracteristiquesEtatChauffageEnergie() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [etatGeneral, setEtatGeneral] = useState(null);
  const [chauffage, setChauffage] = useState(null);
  const [anneeChauffage, setAnneeChauffage] = useState("");
  const [panneauxSolaires, setPanneauxSolaires] = useState(null);
  const [garagesBox, setGaragesBox] = useState("");


  const [openModalSolaires, setOpenModalSolaires] = useState(false);

  const etatOptions = useMemo(() => [
    { value: "neuf", label: "Neuf / récent" },
    { value: "tres_bon", label: "Très bon" },
    { value: "bon", label: "Bon" },
    { value: "travaux", label: "Travaux à prévoir" },
  ], []);
  const chauffageOptions = useMemo(() => [
    { value: "pompe_a_chaleur", label: "Pompe à chaleur" },
    { value: "gaz", label: "Gaz" },
    { value: "mazout", label: "Mazout" },
    { value: "reseau_chaleur", label: "Réseau de chaleur" },
    { value: "electrique", label: "Électrique" },
    { value: "autre", label: "Autre" },
  ], []);
  const boolOptions = [
    { value: true, label: "Oui" },
    { value: false, label: "Non" },
  ];

  const toIntOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const toFloatOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "demandes", id));
        const data = snap.exists() ? snap.data() : {};
        const b = data.bien || {};
        if (!mounted) return;
        setEtatGeneral(b.etatGeneral ?? null);
        setChauffage(b.chauffage ?? null);
        setAnneeChauffage(b.anneeChauffage ?? "");
        setPanneauxSolaires(typeof b.panneauxSolaires === "boolean" ? b.panneauxSolaires : null);
        setGaragesBox(b.garagesBox ?? "");
      } catch (e) {
        console.error(e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const numPropsInt = { inputMode: "numeric", pattern: "[0-9]*" };
  const numPropsDec = { inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, "demandes", id);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      const next = { ...(data.bien || {}) };

      next.etatGeneral = etatGeneral || null;
      next.chauffage = chauffage || null;
      next.anneeChauffage = toIntOrNull(anneeChauffage);

      next.panneauxSolaires = panneauxSolaires === null ? null : panneauxSolaires;
      next.garagesBox = toIntOrNull(garagesBox);
      

      // rappel: ensoleillement/orientation/standing restent null (évalués par IA plus tard)

      await updateDoc(ref, { bien: next });
      navigate(`/bien/${id}`);
    } catch (e) {
      console.error("save état/chauffage/énergie:", e);
      alert("Impossible d’enregistrer. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-base">Chargement...</div>;

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
          <h1 className="text-xl font-semibold">Caractéristiques — État, chauffage & énergie</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-6">
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
                  <IconButton size="small" onClick={() => {}} sx={{ color: "#0047FF", p: 0.5 }}>
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

          

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/bien/${id}`)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-white ${!saving ? "bg-black hover:bg-gray-900" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {saving ? "Enregistrement..." : "Continuer"}
            </button>
          </div>
        </div>

        <ModalMessage
          open={openModalSolaires}
          onClose={() => setOpenModalSolaires(false)}
          onConfirm={() => setOpenModalSolaires(false)}
          title="Panneaux solaires — info"
          message={
            <Typography variant="body1">
              Cochez <strong>Oui</strong> si une installation photovoltaïque ou solaire thermique est présente (toit, façade ou au sol).
            </Typography>
          }
          confirmText="Compris" onlyConfirm showCloseIcon iconType="knowledge"
        />
      </div>
    </div>
  );
}
