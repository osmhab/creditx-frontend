// UploaderDocument.js
import React from "react";
import { Box, Typography, Button } from "@mui/material";

const UploaderDocument = ({ dossierId, type, label }) => {
  return (
    <Box border="1px solid #ddd" borderRadius={2} p={2}>
      <Typography variant="subtitle1">{label}</Typography>
      <Button variant="outlined">Téléverser</Button>
    </Box>
  );
};

export default UploaderDocument;
