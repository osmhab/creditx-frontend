// src/Login.js

import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";



function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    let userCredential;
    if (isRegister) {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    }

    const uid = userCredential.user.uid;

    // 🔍 Lecture du rôle
    const userDoc = await getDoc(doc(db, "users", uid));
    const userData = userDoc.data();
    const role = userData?.role || "user";

    // 🚀 Redirection
    if (role === "banque") {
      navigate("/banque");
    } else {
      navigate("/formulaire");
    }

  } catch (error) {
    alert(error.message);
  }
};


  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-6 rounded shadow text-center">
        <h3 className="text-xl font-semibold mb-4">Connecté en tant que : {user.email}</h3>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}


  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? "Créer un compte" : "Connexion"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded-md"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded-md"
        />
        <button type="submit" className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800">
          {isRegister ? "S'inscrire" : "Se connecter"}
        </button>
        <p
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-center text-blue-600 hover:underline cursor-pointer"
        >
          {isRegister ? "Déjà inscrit ? Se connecter" : "Pas encore de compte ? S'inscrire"}
        </p>
      </form>
    </div>
  </div>
);

}

export default Login;