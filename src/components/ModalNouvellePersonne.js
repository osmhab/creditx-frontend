
import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Grid,
  Alert,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import nationaliteOptions from "./NationaliteOptions";

const ModalNouvellePersonne = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    civilite: "",
    prenom: "",
    nom: "",
    dateNaissance: null,
    nationalite: "",
    etatCivil: "",
    permis: "",
    formation: "",
    profession: "",
    email: "",
    telephone: "",
    rueNumero: "",
    npaLocalite: ""
  });

  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        civilite: initialData.civilite || "",
        prenom: initialData.prenom || "",
        nom: initialData.nom || "",
        dateNaissance: initialData.dateNaissance ? dayjs(initialData.dateNaissance, "DD.MM.YYYY") : null,
        nationalite: initialData.nationalite || "",
        etatCivil: initialData.etatCivil || "",
        permis: initialData.permis || "",
        formation: initialData.formation || "",
        profession: initialData.profession || "",
        email: initialData.email || "",
        telephone: initialData.telephone || "",
        rueNumero: initialData.rueNumero || "",
        npaLocalite: initialData.npaLocalite || ""
      });
    } else {
      setFormData({
        civilite: "",
        prenom: "",
        nom: "",
        dateNaissance: null,
        nationalite: "",
        etatCivil: "",
        permis: "",
        formation: "",
        profession: "",
        email: "",
        telephone: "",
        rueNumero: "",
        npaLocalite: ""
      });
    }
    setErreur(false);
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const isSuisse = formData.nationalite.toLowerCase() === "suisse";
    const champsManquants =
      !formData.civilite || !formData.prenom || !formData.nom || !formData.dateNaissance ||
      !formData.nationalite || !formData.etatCivil || (!isSuisse && !formData.permis) ||
      !formData.profession || !formData.email || !formData.telephone ||
      !formData.rueNumero || !formData.npaLocalite;

    if (champsManquants) {
      setErreur(true);
      return;
    }

    setErreur(false);
    const adresseComplete = `${formData.rueNumero}, ${formData.npaLocalite}`;
    onSave({ ...formData, dateNaissance: formData.dateNaissance.format("DD.MM.YYYY"), adresseComplete });
    onClose();
  };

  const showPermis = formData.nationalite && formData.nationalite.toLowerCase() !== "suisse";

  return (
    <Modal open={open} onClose={(_, reason) => reason !== "backdropClick" && onClose()}>
      <Box
        sx={{
          width: { xs: "95%", md: 900 },
          maxHeight: "90vh",
          overflowY: "auto",
          p: { xs: 3, md: 4 },
          borderRadius: 2,
          bgcolor: "background.paper",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: 24,
        }}
      >
        <Typography variant="h6" mb={3}>
          {initialData ? "Modifier la personne" : "Saisir une nouvelle personne"}
        </Typography>

        {erreur && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Saisissez tous les champs obligatoires.
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <FormControl fullWidth margin="normal" error={erreur && !formData.civilite}>
            <InputLabel>Civilité</InputLabel>
            <Select name="civilite" value={formData.civilite} onChange={handleChange}>
              <MenuItem value="">-- Choisir --</MenuItem>
              <MenuItem value="Monsieur">Monsieur</MenuItem>
              <MenuItem value="Madame">Madame</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} margin="normal" error={erreur && !formData.prenom} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nom" name="nom" value={formData.nom} onChange={handleChange} margin="normal" error={erreur && !formData.nom} />
            </Grid>
          </Grid>

          <DatePicker
            label="Date de naissance"
            value={formData.dateNaissance}
            onChange={(newValue) => setFormData({ ...formData, dateNaissance: newValue })}
            format="DD.MM.YYYY"
            slotProps={{ textField: { fullWidth: true, margin: "normal", error: erreur && !formData.dateNaissance } }}
          />
        </LocalizationProvider>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Rue et numéro" name="rueNumero" value={formData.rueNumero} onChange={handleChange} margin="normal" error={erreur && !formData.rueNumero} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="NPA / Localité" name="npaLocalite" value={formData.npaLocalite} onChange={handleChange} margin="normal" error={erreur && !formData.npaLocalite} />
          </Grid>
        </Grid>

        <TextField fullWidth label="Formation (apprentissage, études, etc.)" name="formation" value={formData.formation} onChange={handleChange} margin="normal" />
        <TextField fullWidth label="Profession" name="profession" value={formData.profession} onChange={handleChange} margin="normal" error={erreur && !formData.profession} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Adresse email" name="email" type="email" value={formData.email} onChange={handleChange} margin="normal" error={erreur && !formData.email} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} margin="normal" error={erreur && !formData.telephone} />
          </Grid>
        </Grid>

        <FormControl fullWidth margin="normal" error={erreur && !formData.nationalite}>
          <InputLabel>Nationalité</InputLabel>
          <Select name="nationalite" value={formData.nationalite} onChange={handleChange}>
            <MenuItem value="">-- Nationalité --</MenuItem>
            {nationaliteOptions}
          </Select>
        </FormControl>

        {showPermis && (
          <FormControl fullWidth margin="normal" error={erreur && !formData.permis}>
            <InputLabel>Permis de séjour</InputLabel>
            <Select name="permis" value={formData.permis} onChange={handleChange}>
              <MenuItem value="">-- Sélectionner le permis --</MenuItem>
              <MenuItem value="B">Permis B</MenuItem>
              <MenuItem value="C">Permis C</MenuItem>
            </Select>
          </FormControl>
        )}

        <FormControl fullWidth margin="normal" error={erreur && !formData.etatCivil}>
          <InputLabel>État civil</InputLabel>
          <Select name="etatCivil" value={formData.etatCivil} onChange={handleChange}>
            <MenuItem value="">-- État civil --</MenuItem>
            <MenuItem value={1}>Célibataire</MenuItem>
            <MenuItem value={2}>Marié(e)</MenuItem>
            <MenuItem value={3}>Divorcé(e)</MenuItem>
            <MenuItem value={4}>Veuf / Veuve</MenuItem>
          </Select>
        </FormControl>

        <Box mt={3} textAlign="right">
          <Button variant="outlined" onClick={onClose} sx={{ mr: 2 }}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {initialData ? "Enregistrer les modifications" : "Ajouter"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ModalNouvellePersonne;
