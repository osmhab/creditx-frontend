import React, { useEffect } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  Typography,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import nationaliteOptions from "./NationaliteOptions";
import ListeEmployeurs from "./ListeEmployeurs";
import ListeEmployeursConjoint from "./ListeEmployeursConjoint";



const Etape1InformationsPersonnelles = ({
  formData,
  setFormData,
  handleChange,
  user,
  masquerDateNaissance,
  docRef,
}) => {
  const handleMaskedDate = (field, value) => {
    const masked = masquerDateNaissance(value);
    setFormData({ ...formData, [field]: masked });
    if (user && docRef) {
      updateDoc(docRef, { [field]: masked });
    }
  };

  const handleSelectWithUpdate = (e) => {
    const value = e.target.value;
    const updatedData = { ...formData, etatCivil: value };
    if (value !== "marie") {
      updatedData.ajouterDeuxiemePersonne = false;
    }
    setFormData(updatedData);
    if (user && docRef) {
      updateDoc(docRef, updatedData);
    }
  };

  const renderPermisSejour = (nationaliteField, permisField) => {
    return formData[nationaliteField] && formData[nationaliteField] !== "Suisse" ? (
      <FormControl fullWidth margin="normal">
        <InputLabel>Permis de séjour</InputLabel>
        <Select
          name={permisField}
          value={formData[permisField] || ""}
          onChange={handleChange}
        >
          <MenuItem value="">-- Sélectionner le permis --</MenuItem>
          <MenuItem value="B">Permis B</MenuItem>
          <MenuItem value="C">Permis C</MenuItem>
        </Select>
      </FormControl>
    ) : null;
  };

  const updateFirestoreField = (field, value) => {
    
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { [field]: value });
    }
    
  };

  

  return (
    <Box>
      <Accordion defaultExpanded sx={{ mt: 2, border: "1px solid #ddd", borderRadius: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
  <Typography variant="h6" fontWeight={600}>
    👤 {formData.prenom ? `Informations de ${formData.prenom}` : "Vos informations"}
  </Typography>
</AccordionSummary>
  <AccordionDetails>
      <FormControl fullWidth margin="normal">
      <InputLabel id="civilite-label">Civilité</InputLabel>
      <Select
        labelId="civilite-label"
        name="civilite"
        value={formData.civilite || ""}
        onChange={handleChange}
      >
        <MenuItem value="">-- Civilité --</MenuItem>
        <MenuItem value="Monsieur">Monsieur</MenuItem>
        <MenuItem value="Madame">Madame</MenuItem>
      </Select>
    </FormControl>

    <TextField fullWidth label="Prénom" name="prenom" value={formData.prenom || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="Nom" name="nom" value={formData.nom || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="Rue et numéro" name="rueNumero" value={formData.rueNumero || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="NPA / Localité" name="npaLocalite" value={formData.npaLocalite || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="Téléphone" name="telephone" value={formData.telephone || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="Date de naissance" name="dateNaissance" value={formData.dateNaissance || ""} onChange={(e) => handleMaskedDate("dateNaissance", e.target.value)} margin="normal" placeholder="JJ.MM.AAAA" inputMode="numeric" />

    <FormControl fullWidth margin="normal">
      <InputLabel id="nationalite-label">Nationalité</InputLabel>
      <Select label="Nationalité" name="nationalite" value={formData.nationalite || ""} onChange={handleChange}>
        <MenuItem value="">-- Nationalité --</MenuItem>
        {nationaliteOptions}
      </Select>
    </FormControl>

    {renderPermisSejour("nationalite", "permisSejour")}

    <FormControl fullWidth margin="normal">
      <InputLabel>État civil</InputLabel>
      <Select label="État civil" name="etatCivil" value={formData.etatCivil || ""} onChange={handleSelectWithUpdate}>
        <MenuItem value="">-- État civil --</MenuItem>
        <MenuItem value="celibataire">Célibataire</MenuItem>
        <MenuItem value="marie">Marié(e)</MenuItem>
        <MenuItem value="divorce">Divorcé(e)</MenuItem>
        <MenuItem value="veuf">Veuf / Veuve</MenuItem>
      </Select>
    </FormControl>

    <TextField fullWidth label="Formation (apprentissage, études, etc.)" name="formation" value={formData.formation || ""} onChange={handleChange} margin="normal" />
    <TextField fullWidth label="Profession" name="profession" value={formData.profession || ""} onChange={handleChange} margin="normal" />

    <Accordion sx={{ mt: 3, border: "1px solid #ddd", borderRadius: 1 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
  <Typography variant="h6" fontWeight={600}>
    💼 Employeurs de {formData.prenom ? formData.prenom : "vous"}
  </Typography>
</AccordionSummary>
  <AccordionDetails>
    <ListeEmployeurs
      employeurs={formData.employeurs || []}
      setEmployeurs={(newList) => {
        const updated = { ...formData, employeurs: newList };
        setFormData(updated);
        updateFirestoreField("employeurs", newList);
      }}
    />
  </AccordionDetails>
</Accordion>


  </AccordionDetails>
</Accordion>


      


{!formData.ajouterDeuxiemePersonne && (
  <Button
    variant="outlined"
    startIcon={<AddIcon />}
    onClick={() =>
      handleChange({
        target: { name: "ajouterDeuxiemePersonne", value: true },
      })
    }
    sx={{ mt: 3, color: "#001BFF", borderColor: "#001BFF", textTransform: "none" }}
  >
    Ajouter 2e personne (conjointement solidaire)
  </Button>
)}




{formData.ajouterDeuxiemePersonne && (
  <Accordion defaultExpanded sx={{ mt: 4, border: "1px solid #ddd", borderRadius: 1 }}>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
  <Typography variant="h6" fontWeight={600}>
    🧑‍🤝‍🧑 Informations de {formData.conjointPrenom ? formData.conjointPrenom : "la 2e personne"}
  </Typography>
</AccordionSummary>

    <AccordionDetails>
      {/* Ton formulaire existant du conjoint ici */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="civilite-conjoint-label">Civilité</InputLabel>
        <Select
          labelId="civilite-conjoint-label"
          name="conjointCivilite"
          value={formData.conjointCivilite || ""}
          onChange={handleChange}
        >
          <MenuItem value="">-- Civilité --</MenuItem>
          <MenuItem value="Monsieur">Monsieur</MenuItem>
          <MenuItem value="Madame">Madame</MenuItem>
        </Select>
      </FormControl>

      <TextField fullWidth label="Prénom du conjoint" name="conjointPrenom" value={formData.conjointPrenom || ""} onChange={handleChange} margin="normal" />
      <TextField fullWidth label="Nom du conjoint" name="conjointNom" value={formData.conjointNom || ""} onChange={handleChange} margin="normal" />
      <TextField
        fullWidth
        label="Rue et numéro"
        name="conjointRueNumero"
        value={formData.conjointRueNumero || ""}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="NPA / Localité"
        name="conjointNpaLocalite"
        value={formData.conjointNpaLocalite || ""}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Téléphone"
        name="conjointTelephone"
        value={formData.conjointTelephone || ""}
        onChange={handleChange}
        margin="normal"
      />
      <TextField fullWidth label="Date de naissance du conjoint" name="conjointDateNaissance" value={formData.conjointDateNaissance || ""} onChange={(e) => handleMaskedDate("conjointDateNaissance", e.target.value)} margin="normal" placeholder="JJ.MM.AAAA" inputMode="numeric" />
      <FormControl fullWidth margin="normal">
        <InputLabel>Nationalité</InputLabel>
        <Select
          name="conjointNationalite"
          value={formData.conjointNationalite || ""}
          onChange={handleChange}
        >
          <MenuItem value="">-- Nationalité --</MenuItem>
          {nationaliteOptions}
        </Select>
      </FormControl>

      {renderPermisSejour("conjointNationalite", "conjointPermisSejour")}

      <TextField
        fullWidth
        label="Formation (apprentissage, études, etc.)"
        name="conjointFormation"
        value={formData.conjointFormation || ""}
        onChange={handleChange}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Profession"
        name="conjointProfession"
        value={formData.conjointProfession || ""}
        onChange={handleChange}
        margin="normal"
      />
      


      <Accordion sx={{ mt: 3, border: "1px solid #ddd", borderRadius: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
  <Typography variant="h6" fontWeight={600}>
    💼 Employeurs de {formData.conjointPrenom ? formData.conjointPrenom : "la 2e personne"}
  </Typography>
</AccordionSummary>

  <AccordionDetails>
    <ListeEmployeursConjoint
      employeurs={formData.conjointEmployeurs || []}
      setEmployeurs={(val) => {
        setFormData({ ...formData, conjointEmployeurs: val });
        updateFirestoreField("conjointEmployeurs", val);
      }}
    />
  </AccordionDetails>
</Accordion>
<Box display="flex" justifyContent="flex-end" mt={3}>
  <Button
    variant="outlined"
    color="error"
    onClick={() =>
      handleChange({
        target: { name: "ajouterDeuxiemePersonne", value: false },
      })
    }
  >
    Supprimer {formData.conjointPrenom || "la 2e personne"}
  </Button>
</Box>

    </AccordionDetails>
  </Accordion>
)}


<Accordion sx={{ mt: 3, border: "1px solid #ddd", borderRadius: 1 }}>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography variant="h6" fontWeight={600}>👶 Enfants à charge</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <FormControlLabel
      control={
        <Checkbox
          checked={formData.ayantEnfants || false}
          onChange={(e) =>
            handleChange({
              target: { name: "ayantEnfants", value: e.target.checked },
            })
          }
          sx={{
            color: "#000",
            "&.Mui-checked": { color: "#001BFF" },
          }}
        />
      }
      label="J’ai des enfants à charge"
    />

    {formData.ayantEnfants && (
      <Box mt={2}>
        {(formData.enfants || []).map((annee, index) => (
          <Box key={index} display="flex" alignItems="center" mb={2} gap={2}>
            <TextField
              label="Année de naissance"
              variant="outlined"
              value={annee}
              onChange={(e) => {
                const newEnfants = [...formData.enfants];
                newEnfants[index] = e.target.value;
                setFormData({ ...formData, enfants: newEnfants });
                updateFirestoreField("enfants", newEnfants);
              }}
              sx={{ flex: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[`enfant_${index}_vous`] || false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      [`enfant_${index}_vous`]: e.target.checked,
                    };
                    setFormData(updated);
                    updateFirestoreField(
                      `enfant_${index}_vous`,
                      e.target.checked
                    );
                  }}
                />
              }
              label={formData.prenom || "Vous"}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[`enfant_${index}_conjoint`] || false}
                  onChange={(e) => {
                    const updated = {
                      ...formData,
                      [`enfant_${index}_conjoint`]: e.target.checked,
                    };
                    setFormData(updated);
                    updateFirestoreField(
                      `enfant_${index}_conjoint`,
                      e.target.checked
                    );
                  }}
                />
              }
              label={formData.conjointPrenom || "Conjoint·e"}
            />
            <IconButton
              onClick={() => {
                const newEnfants = formData.enfants.filter(
                  (_, i) => i !== index
                );
                const updated = { ...formData, enfants: newEnfants };
                delete updated[`enfant_${index}_vous`];
                delete updated[`enfant_${index}_conjoint`];
                setFormData(updated);
                updateFirestoreField("enfants", newEnfants);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            const newEnfants = [...(formData.enfants || []), ""];
            setFormData({ ...formData, enfants: newEnfants });
            updateFirestoreField("enfants", newEnfants);
          }}
        >
          Ajouter un enfant
        </Button>
      </Box>
    )}
  </AccordionDetails>
</Accordion>

</Box>

  );
};

export default Etape1InformationsPersonnelles;
