import React from "react";
import { TextField, InputAdornment } from "@mui/material";

const formaterMilliers = (val) => {
  const digits = val.toString().replace(/\D/g, "");
  if (digits === "") return "0";
  return Number(digits).toLocaleString("fr-CH").replace(/\s/g, "’");
};

const ChampMontantSimple = ({ label, value, onChange }) => {
  const formatted = formaterMilliers(value);

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    const numericValue = digits === "" ? 0 : Number(digits);
    onChange(numericValue);
  };

  return (
    <TextField
      fullWidth
      label={label}
      value={formatted}
      onChange={handleChange}
      margin="normal"
      inputMode="numeric"
      placeholder="CHF Montant"
      InputProps={{
        startAdornment: <InputAdornment position="start">CHF</InputAdornment>,
      }}
    />
  );
};

export default ChampMontantSimple;
