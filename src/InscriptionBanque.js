import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase-config";

function InscriptionBanque() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [banque, setBanque] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        email,
        role: "banque",
        banque
      });

      setMessage("✅ Utilisateur banque créé avec succès !");
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur lors de la création : " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Créer un compte collaborateur banque</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <input
          type="text"
          placeholder="Nom de la banque"
          value={banque}
          onChange={(e) => setBanque(e.target.value)}
          required
        /><br />
        <button type="submit">Créer le compte</button>
      </form>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}

export default InscriptionBanque;
