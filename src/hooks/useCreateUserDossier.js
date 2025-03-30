// src/hooks/useCreateUserDossier.js

import { useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import { db } from "../firebase-config";

export default function useCreateUserDossier() {
  const { user } = useAuth();

  useEffect(() => {
    const checkOrCreateDossier = async () => {
      if (!user) return;

      const ref = doc(db, "dossiers", user.uid);
      const snapshot = await getDoc(ref);

      if (!snapshot.exists()) {
        await setDoc(ref, {
          etape: 1,
          email: user.email,
          createdAt: new Date().toISOString()
        });
        console.log("✅ Dossier initialisé pour:", user.email);
      } else {
        console.log("📄 Dossier déjà existant pour:", user.email);
      }
    };

    checkOrCreateDossier();
  }, [user]);
}
