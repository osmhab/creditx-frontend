import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

const formaterMilliers = (val) => {
  const digits = val.replace(/\D/g, "");
  if (digits === "") return "0";
  return Number(digits).toLocaleString("fr-CH").replace(/\s/g, "’");
};

const ChampMontant = ({
  label,
  name,
  formData,
  setFormData,
  user,
  readOnly = false,
  InputProps = {} // ⬅️ on accepte les props externes
}) => {
  const value = formaterMilliers((formData[name] ?? "").toString());

  const handleChange = async (e) => {
    if (readOnly) return;
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? 0 : Number(digits);
    const newData = { ...formData, [name]: numericValue };
    setFormData(newData);

    if (user) {
      const ref = doc(db, "dossiers", user.uid);
      await updateDoc(ref, { [name]: numericValue });
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      margin="normal"
      inputMode="numeric"
      placeholder="CHF Montant"
      InputProps={{
        readOnly,
        startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
        ...InputProps, // ⬅️ on fusionne proprement avec ceux reçus
      }}
      disabled={readOnly}
    />
  );
};

export default ChampMontant;
