import React, { useState } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { UploadFile } from "@mui/icons-material";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase-config";


const UploadDocument = ({ dossierId, docId, label, existing }) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(!!existing);
  const [status, setStatus] = useState(existing?.status || "");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !dossierId || !docId) return;

    setUploading(true);
    try {
      const storage = getStorage();
      const path = `dossiers/${dossierId}/documents/${docId}.pdf`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const dossierRef = doc(db, "dossiers", dossierId);
      await updateDoc(dossierRef, {
        [`documents.${docId}`]: {
          url,
          uploadedAt: new Date().toISOString(),
          status: "pending"
        }
      });

      setUploaded(true);
      setStatus("pending");
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
    } finally {
      setUploading(false);
    }
  };

  const renderChip = () => {
    if (uploading) return <Chip label="Téléchargement..." color="info" />;
    if (!uploaded) return <Chip label="Manquant" color="error" />;
    if (status === "valide") return <Chip label="Validé" color="success" />;
    if (status === "rejeté") return <Chip label="Rejeté" color="error" />;
    return <Chip label="En validation" color="warning" />;
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Box flexGrow={1}>
        <Typography variant="body2">{label}</Typography>
      </Box>
      {renderChip()}
      <Button
        component="label"
        variant="outlined"
        size="small"
        startIcon={<UploadFile />}
        disabled={uploading}
      >
        Choisir un fichier
        <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
      </Button>
    </Box>
  );
};

export default UploadDocument;
