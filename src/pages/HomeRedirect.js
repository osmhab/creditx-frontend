import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import HomePage from "./HomePage";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (user) {
        const fromLogin =
          document.referrer.includes("/login-client") ||
          document.referrer.includes("/login-banque");

        if (fromLogin) {
          const snap = await getDoc(doc(db, "users", user.uid));
          const data = snap.data();

          if (data?.role === "banque") {
            navigate("/banque");
          } else {
            navigate("/formulaire");
          }

          setRedirected(true);
        }
      }
    };

    if (!loading) check();
  }, [user, loading, navigate]);

  if (loading || redirected) {
    return <div className="text-center mt-10">Redirection en cours...</div>;
  }

  return <HomePage />;
}
