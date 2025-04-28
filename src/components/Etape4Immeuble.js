import React, { useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  MenuItem,
  Select,
  FormGroup,
  Checkbox
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import ChampMontant from "./ChampMontant";
import GoogleAdresseAutocomplete from "./GoogleAdresseAutocomplete";

const Etape4Immeuble = ({ formData, setFormData, user }) => {
  const updateField = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { [name]: value });
    }
  };

  const prixAchat = Number(formData.prixAchat || 0);
  const valeurMarche = Number(formData.valeurMarche || 0);
  const valeurBancaireEstimee = Math.round(0.8 * Math.min(prixAchat, valeurMarche));

  useEffect(() => {
    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      updateDoc(ref, { valeurBancaireEstimee });
    }
  }, [valeurMarche, prixAchat, user]);

  const certificats = ["CECB", "CECB Plus", "Minergie", "Minergie P", "Minergie A", "Minergie Eco", "SNBS"];

  const toggleCertificat = (cert) => {
    const current = formData.certificats || [];
    const updated = current.includes(cert) ? current.filter(c => c !== cert) : [...current, cert];
    updateField("certificats", updated);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Données sur l’immeuble
      </Typography>

      {/* TYPE DE BIEN */}
      <TextField
        select
        fullWidth
        label="Type de bien"
        value={formData.sousTypeBien || ""}
        onChange={(e) => updateField("sousTypeBien", e.target.value)}
        margin="normal"
      >
        <MenuItem value="maison">Maison individuelle</MenuItem>
        <MenuItem value="appartement">Appartement en PPE</MenuItem>
      </TextField>

      <ChampMontant
        label="Prix d’achat"
        name="prixAchat"
        formData={formData}
        setFormData={setFormData}
        user={user}
        readOnly
/>


      <Divider sx={{ my: 3 }} />
    
      <GoogleAdresseAutocomplete
  formData={formData}
  setFormData={setFormData}
  user={user}
/>


      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Caractéristiques</Typography>
      <TextField select fullWidth label="État général" value={formData.etatBien || ""} onChange={(e) => updateField("etatBien", e.target.value)} margin="normal">
        <MenuItem value="neuf">Neuf</MenuItem>
        <MenuItem value="bon">Bon</MenuItem>
        <MenuItem value="à rénover">À rénover</MenuItem>
      </TextField>
      <TextField select fullWidth label="Type de construction" value={formData.typeConstruction || ""} onChange={(e) => updateField("typeConstruction", e.target.value)} margin="normal">
        <MenuItem value="béton">Béton</MenuItem>
        <MenuItem value="brique">Brique</MenuItem>
        <MenuItem value="bois">Bois</MenuItem>
        <MenuItem value="acier">Acier</MenuItem>
        <MenuItem value="ossature bois">Ossature bois</MenuItem>
        <MenuItem value="préfabriqué">Préfabriqué</MenuItem>
      </TextField>
      <TextField fullWidth type="number" label="Année de construction" value={formData.anneeConstruction || ""} onChange={(e) => updateField("anneeConstruction", e.target.value)} margin="normal" />
      <TextField fullWidth label="Année(s) de rénovation(s)" value={formData.anneeRenovation || ""} onChange={(e) => updateField("anneeRenovation", e.target.value)} margin="normal" />

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Surfaces</Typography>
      <TextField fullWidth type="number" label="Surface brute (m²)" value={formData.surfaceHabitable || ""} onChange={(e) => updateField("surfaceHabitable", e.target.value)} margin="normal" />
      <TextField fullWidth type="number" label="Nombre de pièces" value={formData.nombrePieces || ""} onChange={(e) => updateField("nombrePieces", e.target.value)} margin="normal" />
      <TextField fullWidth type="number" label="Nombre de salles d’eau" value={formData.nombreSallesEau || ""} onChange={(e) => updateField("nombreSallesEau", e.target.value)} margin="normal" />

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Extérieurs / Annexes</Typography>
      <TextField fullWidth type="number" label="Surface jardin (m²)" value={formData.surfaceJardin || ""} onChange={(e) => updateField("surfaceJardin", e.target.value)} margin="normal" />
      <TextField fullWidth type="number" label="Surface terrasse / balcon (m²)" value={formData.surfaceTerrasse || ""} onChange={(e) => updateField("surfaceTerrasse", e.target.value)} margin="normal" />
      {formData.sousTypeBien !== "appartement" && (
  <TextField fullWidth type="number" label="Surface terrain (m²)" value={formData.surfaceTerrain || ""} onChange={(e) => updateField("surfaceTerrain", e.target.value)} margin="normal" />
)}
      <TextField fullWidth type="number" label="Places de parc extérieures" value={formData.placesExt || ""} onChange={(e) => updateField("placesExt", e.target.value)} margin="normal" />
      <TextField fullWidth type="number" label="Places de parc intérieures (box/garage)" value={formData.placesInt || ""} onChange={(e) => updateField("placesInt", e.target.value)} margin="normal" />

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1">Travaux / Technique</Typography>
      <ChampMontant label="Travaux prévus (CHF)" name="travauxPrevus" formData={formData} setFormData={setFormData} user={user} />
      <TextField select fullWidth label="Type de chauffage" value={formData.chauffage || ""} onChange={(e) => updateField("chauffage", e.target.value)} margin="normal">
        <MenuItem value="mazout">Chauffage au mazout</MenuItem>
        <MenuItem value="gaz">Chauffage au gaz</MenuItem>
        <MenuItem value="geothermique">Sonde géothermique / pompe à chaleur</MenuItem>
        <MenuItem value="pac-air-eau">Pompe à chaleur air / eau</MenuItem>
        <MenuItem value="pellets">Chauffage à pellets / copeaux</MenuItem>
        <MenuItem value="electrique">Chauffage électrique</MenuItem>
        <MenuItem value="distance">Chauffage à distance</MenuItem>
        <MenuItem value="inconnu">Je n'ai pas cette information</MenuItem>
      </TextField>
      <TextField select fullWidth label="Photovoltaïque (électricité)" value={formData.photovoltaique || ""} onChange={(e) => updateField("photovoltaique", e.target.value)} margin="normal">
        <MenuItem value="oui">Oui</MenuItem>
        <MenuItem value="non">Non</MenuItem>
        <MenuItem value="inconnu">Je n'ai pas cette information</MenuItem>
      </TextField>
      <TextField select fullWidth label="Panneaux solaires (thermique)" value={formData.solairesThermiques || ""} onChange={(e) => updateField("solairesThermiques", e.target.value)} margin="normal">
        <MenuItem value="oui">Oui</MenuItem>
        <MenuItem value="non">Non</MenuItem>
        <MenuItem value="inconnu">Je n'ai pas cette information</MenuItem>
      </TextField>
      <TextField select fullWidth label="Distribution de la chaleur" value={formData.distributionChaleur || ""} onChange={(e) => updateField("distributionChaleur", e.target.value)} margin="normal">
        <MenuItem value="sol">Chauffage par le sol</MenuItem>
        <MenuItem value="radiateur">Radiateur / corps de chauffe</MenuItem>
        <MenuItem value="fourneau">Fourneau central</MenuItem>
        <MenuItem value="inconnu">Je n'ai pas cette information</MenuItem>
      </TextField>

      <FormGroup sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Certificats (multi-choix)
        </Typography>
        {certificats.map((cert) => (
          <FormControlLabel
            key={cert}
            control={<Checkbox checked={(formData.certificats || []).includes(cert)} onChange={() => toggleCertificat(cert)} />}
            label={cert}
          />
        ))}
      </FormGroup>

      {formData.sousTypeBien === "appartement" && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1">🏢 Informations PPE</Typography>
          <TextField fullWidth label="Quote-part (‰)" value={formData.quotePart || ""} onChange={(e) => updateField("quotePart", e.target.value)} margin="normal" />
          <TextField fullWidth label="Étage de l’appartement" value={formData.etageAppartement || ""} onChange={(e) => updateField("etageAppartement", e.target.value)} margin="normal" />
          <TextField fullWidth label="Nombre total d'appartements" value={formData.nombreAppartements || ""} onChange={(e) => updateField("nombreAppartements", e.target.value)} margin="normal" />
          <ChampMontant label="Charges PPE mensuelles (CHF)" name="chargesPPE" formData={formData} setFormData={setFormData} user={user} />
        </>
      )}

    </Box>
  );
};

export default Etape4Immeuble;
