import React, { useState } from "react";
import { db } from "../firebase-config";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { Button, Box } from "@mui/material";

const TestFirestore = () => {
  const [docId, setDocId] = useState(null);

  const createDoc = async () => {
    try {
      const docRef = await addDoc(collection(db, "testHabib"), {
        name: "Habib",
        step: 1,
        createdAt: new Date(),
      });
      setDocId(docRef.id);
      console.log("✅ Document créé :", docRef.id);
    } catch (err) {
      console.error("❌ Erreur création :", err);
    }
  };

  const updateDocStep = async () => {
    if (!docId) return;
    try {
      const ref = doc(db, "testHabib", docId);
      await updateDoc(ref, { step: 2 });
      console.log("✏️ Document mis à jour :", docId);
    } catch (err) {
      console.error("❌ Erreur update :", err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Button onClick={createDoc} variant="contained" sx={{ mr: 2 }}>
        Créer document
      </Button>
      <Button onClick={updateDocStep} variant="outlined" disabled={!docId}>
        Mettre à jour
      </Button>
    </Box>
  );
};

export default TestFirestore;

