// src/utils/firebase/getDemandeRef.js
import { collection, query, where, orderBy, getDocs, doc } from "firebase/firestore";
import { db, auth } from "../../firebase-config";

export const getDemandeRef = async () => {
  const docId = localStorage.getItem("currentDemandeId");

  if (docId) {
    return doc(db, "demandes", docId);
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const q = query(
    collection(db, "demandes"),
    where("uid", "==", user.uid),
    orderBy("dateCreation", "desc")
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Aucune demande trouvée");

  const lastDoc = snapshot.docs[0];
  localStorage.setItem("currentDemandeId", lastDoc.id);

  return lastDoc.ref;
};
