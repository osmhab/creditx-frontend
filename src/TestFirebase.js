import React, { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config";

const TestFirebase = () => {
  useEffect(() => {
    const testFirestoreWrite = async () => {
      try {
        const ref = doc(db, "testCollection", "testDoc");
        await setDoc(ref, {
          message: "Hello from Creditx!",
          timestamp: new Date().toISOString()
        });
        console.log("✅ Document écrit avec succès !");
      } catch (error) {
        console.error("❌ Erreur Firebase :", error);
      }
    };

    testFirestoreWrite();
  }, []);

  return <p>Test Firebase exécuté (écriture en cours... voir la console)</p>;
};

export default TestFirebase;
