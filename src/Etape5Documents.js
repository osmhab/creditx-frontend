// Fichier complet avec regroupement par personne, couleur sur ligne ouverte, etc.
// Copie et colle ce code dans ton projet React à la place de ton ancien Etape5Documents.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Snackbar,
  Alert,
  GlobalStyles,
} from "@mui/material";

import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";



import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "./firebase-config";

const Etape5Documents = ({ dossierId, onReady }) => {
  const [formData, setFormData] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [docToDelete, setDocToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [analysesGPT, setAnalysesGPT] = useState({});
  const [docOuvert, setDocOuvert] = useState(null);

  useEffect(() => {
    const fetchDossier = async () => {
      const snap = await getDoc(doc(db, "dossiers", dossierId));
      if (snap.exists()) {
        const data = snap.data();
        setFormData(data);
        setUploadedDocs(data.documents || {});
      }
    };
    fetchDossier();
  }, [dossierId]);

  useEffect(() => {
    if (formData) {
      const allDocs = getAllDocuments(formData);
      const totalComplets = allDocs.every((doc) => uploadedDocs[doc.id]);
      onReady(totalComplets);
    }
  }, [formData, uploadedDocs, onReady]);

  const getAllDocuments = (data) => {
    if (!formData) return [];
    const personnes = data.personnes || [];
    const fonds = data.fondsPropres || [];
    const isCouple = personnes.length === 2 && personnes.every((p) => p.etatCivil === 2);
    const nomDeclaration = isCouple
      ? personnes.map((p) => p.prenom + " " + p.nom).join(" & ")
      : personnes[0]?.prenom + " " + personnes[0]?.nom;

    const generaux = [
      { id: "declarationImpots", label: `Déclaration d’impôt 2023 pour ${nomDeclaration}` },
      { id: "extraitRegistreFoncier", label: "Extrait du registre foncier < 6 mois" },
      { id: "dossierPhotos", label: "Dossier de vente PDF ou photos" },
      { id: "promesseAchat", label: "Promesse d’achat (facultatif)" },
      { id: "contratReservation", label: "Contrat de réservation (facultatif)" },
      { id: "contratVente", label: "Contrat de vente (facultatif)" },
    ];

    const parPersonne = personnes.flatMap((personne, index) => {
      const idPers = personne.id || index;
      const fondsPers = fonds.filter((f) => f.personneId === idPers);
      const base = [{ id: `poursuites_${idPers}`, label: `Extrait de poursuites pour ${personne.prenom} ${personne.nom}` }];

      fondsPers.forEach((f, i) => {
        const montant = Number(f.montant || 0).toLocaleString("fr-CH") + " CHF";
        const institution = f.institution || "";
        if (f.type === "Comptes / titres") {
          base.push({ id: `releveCompte_${idPers}_${i}`, label: `Relevé compte « ${institution} » (${montant})` });
        }
        if (f.type === "3e pilier" && f.origine === "banque") {
          base.push({ id: `releve3aBanque_${idPers}_${i}`, label: `Relevé 3a banque ${institution} (${montant})` });
        }
        if (f.type === "3e pilier" && f.origine === "assurance") {
          base.push({ id: `rachat3a_${idPers}_${i}`, label: `Rachat 3a ${institution} (${montant})` });
        }
        if (f.type === "2e pilier") {
          base.push({ id: `certificatLPP_${idPers}_${i}`, label: "Certificat 2e pilier" });
          base.push({ id: `simulationLPP_${idPers}_${i}`, label: "Simulation retrait 2e pilier" });
        }
      });
      return [{ section: `${personne.prenom} ${personne.nom}`, docs: base }];
    });

    return [
      { section: "Documents généraux", docs: generaux },
      ...parPersonne
    ];
  };

  const estPresent = (docId) => uploadedDocs[docId];

  const afficherBadgeValidation = (docId) => {
    const analyse = analysesGPT[docId];
    if (!analyse || !analyse.validation) return null;
    const valide = analyse.validation === "valide";
    return (
      <Chip
        label={valide ? "✅ Validé par IA" : "⚠️ Données incompatibles"}
        color={valide ? "success" : "warning"}
        size="small"
        variant="outlined"
      />
    );
  };





const renderRow = (doc) => {
  const present = estPresent(doc.id);
  const selected = docOuvert === doc.id;
  const analyse = analysesGPT[doc.id];
  const validation = analyse?.validation;


  let statutChip = null;

  if (!present) {
    statutChip = (
      <Chip
        label="Manquant"
        icon={<CancelIcon />}
        color="error"
        size="small"
      />
    );
  } else if (!analyse) {
    statutChip = null; // Pas de chip tant que l’IA n’a rien renvoyé
  } else if (analyse.validation === "valide") {
    statutChip = (
      <Chip
        label="Validé"
        icon={<CheckCircleIcon sx={{ color: "#4CAF50" }} />}
        size="small"
        sx={{
          bgcolor: "#E8F5E9",
          color: "#388E3C",
          fontWeight: 500,
          borderRadius: "6px",
          px: 1,
        }}
      />
    );
  } else {
    statutChip = (
      <Chip
        label="Document non conforme"
        icon={<WarningAmberIcon sx={{ color: "#FBC02D" }} />}
        size="small"
        sx={{
          bgcolor: "#FFFDE7",
          color: "#F57F17",
          border: "1px solid #FBC02D",
          fontWeight: 500,
          borderRadius: "6px",
          px: 1,
        }}
      />
    );
  }

  return (
    <React.Fragment key={doc.id}>
      <TableRow
        hover
        onClick={() => setDocOuvert((prev) => (prev === doc.id ? null : doc.id))}
        style={{
          cursor: "pointer",
          backgroundColor: selected ? "#F5F5F5" : undefined,
        }}
      >
        <TableCell>{doc.label}</TableCell>
       <TableCell align="center">
  <Box display="flex" alignItems="center" justifyContent="center">
    {!present ? (
  <CancelIcon sx={{ color: "#F44336" }} />
) : analyse === null ? (
  <CircularProgress size={20} />
) : validation === "valide" ? (
  <CheckCircleIcon sx={{ color: "#4CAF50" }} />
) : validation === "incompatible" ? (
  <WarningAmberIcon sx={{ color: "#FBC02D" }} />
) : null}

  </Box>
</TableCell>




        <TableCell>
          {present ? (
            <Box display="flex" alignItems="center" gap={1}>
  <Tooltip
    title={
      <iframe
        src={uploadedDocs[doc.id]}
        width="300"
        height="400"
        style={{ border: "none" }}
      />
    }
    placement="top"
    arrow
  >
    <span>
      <Button
        size="small"
        variant="outlined"
        sx={{
          textTransform: "none",
          color: "#555",
          borderColor: "#ccc",
          "&:hover": {
            backgroundColor: "#f5f5f5",
            borderColor: "#999",
          },
        }}
        disabled={uploadingId === doc.id || analyse === null}
        onClick={(e) => {
          e.stopPropagation();
          window.open(uploadedDocs[doc.id], "_blank");
        }}
      >
        Voir
      </Button>
    </span>
  </Tooltip>

  <Button
    size="small"
    variant="outlined"
    sx={{
      textTransform: "none",
      color: "#b71c1c",
      borderColor: "#ef9a9a",
      "&:hover": {
        backgroundColor: "#ffebee",
        borderColor: "#d32f2f",
      },
    }}
    disabled={uploadingId === doc.id || analyse === null}
    onClick={(e) => {
      e.stopPropagation();
      setDocToDelete(doc.id);
      setConfirmOpen(true);
    }}
  >
    Supprimer
  </Button>
</Box>



          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={
                uploadingId === doc.id ? (
                  <CircularProgress size={18} />
                ) : (
                  <UploadFileIcon />
                )
              }
              size="small"
              disabled={uploadingId === doc.id}
              onClick={(e) => e.stopPropagation()}
            >
              {uploadingId === doc.id ? "Chargement..." : "Choisir"}
              <input
                type="file"
                hidden
                accept="application/pdf,image/*"
                onChange={(e) => handleUpload(doc.id, e.target.files[0])}
              />
            </Button>
          )}
        </TableCell>
      </TableRow>

      {selected && (
        <TableRow>
          <TableCell colSpan={3} style={{ padding: 0, border: "none" }}>
            <Collapse in timeout={400}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  animation: "fadeSlide 0.4s ease",
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Détails de l’analyse IA
                </Typography>
                <Typography
                  variant="body2"
                  fontStyle="italic"
                  color="text.secondary"
                >
                  {analyse ? (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        margin: 0,
                        fontSize: "0.85rem",
                      }}
                    >
                      {JSON.stringify(analyse, null, 2)}
                    </pre>
                  ) : (
                    "Aucune analyse disponible pour ce document."
                  )}
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};




  const getTypeAttendu = (docId) => {
  if (docId.startsWith("certificatLPP")) return "Certificat 2e pilier";
  if (docId.startsWith("simulationLPP")) return "Simulation de retrait LPP";
  if (docId.startsWith("releve3aBanque")) return "Relevé 3e pilier bancaire";
  if (docId.startsWith("rachat3a")) return "Attestation rachat 3e pilier assurance";
  if (docId.startsWith("releveCompte")) return "Relevé de compte bancaire";
  if (docId === "declarationImpots") return "Déclaration d'impôt";
  if (docId === "extraitRegistreFoncier") return "Extrait du registre foncier";
  if (docId === "promesseAchat") return "Promesse d'achat";
  if (docId === "contratVente") return "Contrat de vente";
  if (docId === "contratReservation") return "Contrat de réservation";
  return "Document financier";
};





  const handleUpload = async (docId, file) => {
  if (!file || !dossierId) return;
  setUploadingId(docId);

  const storageRef = ref(storage, `dossiers/${dossierId}/${docId}`);
  try {
    // 1. Upload Firebase
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "dossiers", dossierId), { [`documents.${docId}`]: url });
    setUploadedDocs((prev) => ({ ...prev, [docId]: url }));
    setAnalysesGPT((prev) => ({ ...prev, [docId]: null }));


    // 2. OCR
    const formDataFile = new FormData();
    formDataFile.append("fichier", file);
    const ocrRes = await axios.post("http://localhost:5050/api/ocr", formDataFile, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const ocrTexte = ocrRes.data.texte;
    console.log("📄 Texte OCR :", ocrTexte);

    // 3. Appel IA
    const typeAttendu = getTypeAttendu(docId);
    const analyseRes = await axios.post("http://localhost:5050/api/analyse-document", {
      texte: ocrTexte,
      typeAttendu,
      formData,
    });

    console.log("🧠 Analyse GPT réussie :", analyseRes.data);

    // 4. Stocke analyse
    setAnalysesGPT((prev) => ({ ...prev, [docId]: analyseRes.data }));

    // 5. Message utilisateur
    setSnackbar({
      open: true,
      message: "Document analysé par l’IA.",
      severity: "success",
    });
  } catch (error) {
    console.error("Erreur upload ou analyse IA :", error);
    setSnackbar({
      open: true,
      message: "Erreur pendant l’upload ou l’analyse.",
      severity: "error",
    });
  } finally {
    setUploadingId(null);
  }
};


  const groupes = getAllDocuments(formData);

  return (
    <>
      <GlobalStyles styles={{ "@keyframes fadeSlide": { "0%": { opacity: 0, transform: "translateY(-10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } } }} />
      <Box>
        <Typography variant="h5" mb={3}>Documents à fournir</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
  <TableRow>
    <TableCell>Document</TableCell>
    <TableCell>Statut</TableCell>
    <TableCell align="right">Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {groupes.map((groupe, idx) => (
    <React.Fragment key={idx}>
      <TableRow>
        <TableCell colSpan={3} sx={{ backgroundColor: "#f3f3f3", fontWeight: "bold" }}>
          {groupe.section}
        </TableCell>
      </TableRow>



      {groupe.docs.map((doc) => {
  const present = estPresent(doc.id);
  const analyse = analysesGPT[doc.id];
  const selected = docOuvert === doc.id;
  const validation = analyse?.validation;

  return (
    <React.Fragment key={doc.id}>
      <TableRow
        hover
        onClick={() => setDocOuvert((prev) => (prev === doc.id ? null : doc.id))}
        sx={{ cursor: "pointer", backgroundColor: selected ? "#F5F5F5" : "transparent" }}
      >
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            {!present ? (
              <CancelIcon sx={{ color: "#F44336" }} />
            ) : validation === "valide" ? (
              <CheckCircleIcon sx={{ color: "#4CAF50" }} />
            ) : validation === "incompatible" ? (
              <WarningAmberIcon sx={{ color: "#FBC02D" }} />
            ) : null}
            <Typography>{doc.label}</Typography>
          </Box>
        </TableCell>
        <TableCell />


        <TableCell align="right">
  {present ? (
    <Box display="flex" gap={1} justifyContent="flex-end">
      <Button
        variant="outlined"
        size="small"
        sx={{
          textTransform: "none",
          color: "#333",
          borderColor: "#CCC",
          px: 2,
          "&:hover": {
            backgroundColor: "#f5f5f5",
            borderColor: "#999",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          window.open(uploadedDocs[doc.id], "_blank");
        }}
      >
        Voir
      </Button>
      <Button
        variant="outlined"
        size="small"
        sx={{
          textTransform: "none",
          color: "#b71c1c",
          borderColor: "#ef9a9a",
          px: 2,
          "&:hover": {
            backgroundColor: "#ffebee",
            borderColor: "#d32f2f",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          setDocToDelete(doc.id);
          setConfirmOpen(true);
        }}
      >
        Supprimer
      </Button>
    </Box>
  ) : (
    <Button
      variant="contained"
      size="small"
      component="label"
      sx={{
        textTransform: "none",
        backgroundColor: "#2979ff",
        color: "#fff",
        px: 2,
        "&:hover": {
          backgroundColor: "#1565c0",
        },
      }}
      onClick={(e) => e.stopPropagation()}
    >
      Télécharger
      <input
        type="file"
        hidden
        onChange={(e) => handleUpload(doc.id, e.target.files[0])}
      />
    </Button>
  )}
</TableCell>



      </TableRow>

      {selected && (
        <TableRow>
          <TableCell colSpan={3} sx={{ p: 0, border: "none" }}>
            <Collapse in timeout={400} unmountOnExit>
              <Box sx={{ px: 3, py: 2, bgcolor: "#f9f9f9" }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Détails de l’analyse IA
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="monospace"
                  color="text.secondary"
                >
                  {analyse ? (
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                      {JSON.stringify(analyse, null, 2)}
                    </pre>
                  ) : (
                    "Aucune analyse disponible."
                  )}
                </Typography>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
})}

    </React.Fragment>
  ))}




  
</TableBody>


          </Table>
        </TableContainer>

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogContent>
            <Typography>Es-tu sûr de vouloir supprimer ce document ?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Annuler</Button>
            <Button color="error" onClick={async () => {
              try {
                await updateDoc(doc(db, "dossiers", dossierId), { [`documents.${docToDelete}`]: null });
                setUploadedDocs((prev) => { const copy = { ...prev }; delete copy[docToDelete]; return copy; });
                setSnackbar({ open: true, message: "Document supprimé.", severity: "info" });
              } catch (err) {
                setSnackbar({ open: true, message: "Échec de la suppression.", severity: "error" });
              } finally {
                setConfirmOpen(false);
                setDocToDelete(null);
              }
            }}>Supprimer</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Etape5Documents;