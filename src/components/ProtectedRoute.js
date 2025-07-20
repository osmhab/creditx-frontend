// src/components/ProtectedRoute.js

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase-config";
import { useAuth } from "../AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return setHasAccess(false);

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.data();

        if (!data || !data.role) {
          setHasAccess(false); // utilisateur sans rôle
        } else {
          setHasAccess(data.role === role);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle :", error);
        setHasAccess(false);
      }
    };

    if (!loading) checkRole();
  }, [user, loading, role]);

  if (loading || hasAccess === null) {
    return <div className="text-center mt-10">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login-client" replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/login-client" replace />;
  }

  return children;
}

export default ProtectedRoute;
