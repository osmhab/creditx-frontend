// VERSION FINALE avec logique dynamique revenus vs bonus
import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Slider,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import ChampMontantSimple from "./ChampMontantSimple";

dayjs.locale("fr");

const ModalNouvelEmployeur = ({ open, onClose, onSave, initialData }) => {
  const [etape, setEtape] = useState(1);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [statutEntreprise, setStatutEntreprise] = useState("salarié");
  const [debut, setDebut] = useState(null);
  const [tauxActivite, setTauxActivite] = useState(100);
  const [erreur, setErreur] = useState(false);

  const [revenusReguliers, setRevenusReguliers] = useState(true);
  const [revenuMensuel, setRevenuMensuel] = useState(0);
  const [frequenceMensuelle, setFrequenceMensuelle] = useState("12x");
  const [revenu, setRevenu] = useState(0);
  const [bonus, setBonus] = useState(0);

  const [revenusIrr, setRevenusIrr] = useState({});

  const currentYear = dayjs().year();

  const anneesRevenus = () => {
    if (!debut) return [];
    const debutYear = dayjs(debut).year();
    return [1, 2, 3].map((offset) => currentYear - offset).filter((year) => debutYear <= year);
  };

  const anneesBonus = () => {
    if (!debut) return [];
    const debutYear = dayjs(debut).year();
    return [0, 1, 2].map((offset) => currentYear - offset).filter((year) => debutYear <= year);
  };




  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setNom(initialData.nom || "");
      setAdresse(initialData.adresse || "");
      setDebut(initialData.debut ? dayjs(initialData.debut) : null);
      setTauxActivite(initialData.tauxActivite || 100);
      setStatutEntreprise(initialData.statutEntreprise || "salarié");
      setRevenusReguliers(initialData.revenusReguliers ?? true);
      setRevenuMensuel(initialData.revenuMensuel || 0);
      setFrequenceMensuelle(initialData.frequenceMensuelle || "12x");
      setRevenu(initialData.revenu || 0);
      setBonus(initialData.bonus || 0);
      setRevenusIrr(initialData.revenusIrr || {});
    } else {
      setNom("");
      setAdresse("");
      setDebut(null);
      setTauxActivite(100);
      setStatutEntreprise("salarié");
      setRevenusReguliers(true);
      setRevenuMensuel(0);
      setFrequenceMensuelle("12x");
      setRevenu(0);
      setBonus(0);
      setRevenusIrr({});
    }
    setErreur(false);
    setEtape(1);
  }, [open, initialData]);

  useEffect(() => {
    if (revenusReguliers) {
      const facteur = frequenceMensuelle === "13x" ? 13 : 12;
      setRevenu(revenuMensuel * facteur);
    }
  }, [revenuMensuel, frequenceMensuelle, revenusReguliers]);

  const handleNext = () => {
    if (!nom || !adresse || !debut || !statutEntreprise) {
      setErreur(true);
      return;
    }
    setErreur(false);
    setEtape(2);
  };

  const handleSubmit = () => {
    const dataToSave = {
      nom,
      adresse,
      debut: debut.toISOString(),
      tauxActivite,
      statutEntreprise,
      revenusReguliers,
      revenu,
      bonus,
      revenuMensuel,
      frequenceMensuelle,
      revenusIrr,
    };
    onSave(dataToSave);
    onClose();
  };

  return (
    <Modal open={open} onClose={(_, reason) => reason !== "backdropClick" && onClose()}>
      <Box sx={{ width: 600, maxHeight: "90vh", overflowY: "auto", p: 4, borderRadius: 2, backgroundColor: "white", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <Typography variant="h6" mb={2}>{initialData ? "Modifier l'employeur" : "Ajouter un employeur"}</Typography>

        {etape === 1 && (
          <>
            {erreur && <Box sx={{ backgroundColor: "#f44336", color: "#fff", p: 1, mb: 2, borderRadius: 1 }}>Tous les champs obligatoires doivent être remplis.</Box>}

            <TextField fullWidth label="Nom de l’employeur" value={nom} onChange={(e) => setNom(e.target.value)} margin="normal" error={erreur && !nom} />
            <TextField fullWidth label="Adresse de l’employeur" value={adresse} onChange={(e) => setAdresse(e.target.value)} margin="normal" error={erreur && !adresse} />

            <Typography fontWeight="bold" mt={3} mb={1}>Statut dans l'entreprise</Typography>
            <ToggleButtonGroup value={statutEntreprise} exclusive onChange={(e, val) => val !== null && setStatutEntreprise(val)} fullWidth color="primary">
              <ToggleButton value="salarié">Salarié</ToggleButton>
              <ToggleButton value="indépendant">Indépendant</ToggleButton>
            </ToggleButtonGroup>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Début de l'emploi" value={debut} onChange={(val) => setDebut(val)} slotProps={{ textField: { fullWidth: true, margin: "normal", error: erreur && !debut } }} />
            </LocalizationProvider>

            <Typography fontWeight="bold" mb={1}>Taux d’activité (%)</Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box sx={{ width: 320 }}>
                <Slider value={tauxActivite} onChange={(_, val) => setTauxActivite(val)} min={0} max={100} step={20} valueLabelDisplay="auto" marks={[20, 40, 60, 80, 100].map((v) => ({ value: v, label: `${v}%` }))} />
              </Box>
              <TextField type="number" value={tauxActivite} onChange={(e) => { const val = parseInt(e.target.value) || 0; if (val >= 0 && val <= 100) setTauxActivite(val); }} InputProps={{ endAdornment: <span style={{ marginLeft: 4 }}>%</span> }} sx={{ width: 100 }} />
            </Box>

            <Box mt={4} textAlign="right">
              <Button variant="outlined" onClick={onClose} sx={{ mr: 2 }}>Annuler</Button>
              <Button variant="contained" onClick={handleNext}>Continuer</Button>
            </Box>
          </>
        )}

        {etape === 2 && (
          <>
            {statutEntreprise === "indépendant" && anneesRevenus().map((year) => (
              <ChampMontantSimple
                key={`revenu-${year}`}
                label={`Revenu d’exploitation net ${year}`}
                value={revenusIrr[`revenuAnnuel${year}`] || 0}
                onChange={(val) => setRevenusIrr((prev) => ({ ...prev, [`revenuAnnuel${year}`]: val }))}
              />
            ))}

            {statutEntreprise === "salarié" && (
              <>
                <FormControlLabel control={<Switch checked={!revenusReguliers} onChange={(e) => setRevenusReguliers(!e.target.checked)} />} label="Revenus irréguliers ?" sx={{ mb: 3 }} />

                {revenusReguliers && (
                  <>
                    <ChampMontantSimple label="Revenu mensuel brut (CHF)" value={revenuMensuel} onChange={setRevenuMensuel} />
                    <FormControl sx={{ mt: 2 }}>
                      <FormLabel>Fréquence</FormLabel>
                      <ToggleButtonGroup
                        value={frequenceMensuelle}
                        exclusive
                        onChange={(e, val) => val !== null && setFrequenceMensuelle(val)}
                        sx={{ mt: 1 }}
                      >
                        <ToggleButton value="12x">12x</ToggleButton>
                        <ToggleButton value="13x">13x</ToggleButton>
                      </ToggleButtonGroup>
                    </FormControl>
                  </>
                )}

                {!revenusReguliers && anneesRevenus().map((year) => (
                  <ChampMontantSimple
                    key={`revenu-${year}`}
                    label={`Revenu annuel brut (sans le bonus) ${year}`}
                    value={revenusIrr[`revenuAnnuel${year}`] || 0}
                    onChange={(val) => setRevenusIrr((prev) => ({ ...prev, [`revenuAnnuel${year}`]: val }))}
                  />
                ))}

                {anneesBonus().map((year) => (
                  <ChampMontantSimple
                    key={`bonus-${year}`}
                    label={`Bonus ${year}`}
                    value={revenusIrr[`bonus${year}`] || 0}
                    onChange={(val) => setRevenusIrr((prev) => ({ ...prev, [`bonus${year}`]: val }))}
                  />
                ))}
              </>
            )}

            <Box mt={4} textAlign="right">
              <Button variant="outlined" onClick={() => setEtape(1)} sx={{ mr: 2 }}>Retour</Button>
              <Button variant="contained" onClick={handleSubmit}>Ajouter</Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ModalNouvelEmployeur;
