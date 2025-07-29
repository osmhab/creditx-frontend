import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import LogoCreditXWhite from "../assets/logo-creditx-white.svg";
import LogoCreditXGrey from "../assets/logo-creditx-grey.svg";
import { getFunctions, httpsCallable } from "firebase/functions";


function AuthForm({ title, role, redirectTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailToConfirm, setEmailToConfirm] = useState("");


  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

useEffect(() => {
  if (!user) return;

  // Ne rien faire si l'email n'est pas vérifié
  if (!user.emailVerified) return;

  const authPaths = ["/login-client", "/auth", "/login"];
  if (!authPaths.includes(location.pathname)) return;

  const check = async () => {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();

    if (data?.role === "banque") {
      navigate("/banque");
    } else {
      navigate("/dashboard");
    }
  };

  check();
}, [user, navigate, location.pathname]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (forgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Un e-mail de réinitialisation a été envoyé.");
        setForgotPassword(false);
        setIsRegister(false);
        setEmail("");
        return;
      }

      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
          email,
          role,
          createdAt: new Date(),
        });

        await signOut(auth);

        setEmailToConfirm(email);
        setVerificationSent(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          await signOut(auth);
          throw new Error("Veuillez vérifier votre adresse e-mail avant de vous connecter.");
        }

        const uid = user.uid;
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.data();

        if (userData?.role !== role) {
          throw new Error("Ce compte n'appartient pas à cette section.");
        }

        navigate(redirectTo);
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
  setErrorMsg("");
  setSuccessMsg("");

  try {
    const functions = getFunctions();
    const resend = httpsCallable(functions, "resendVerificationEmail");
    await resend({ email: emailToConfirm });

    setSuccessMsg("E-mail de vérification renvoyé avec succès.");
  } catch (error) {
    setErrorMsg("Erreur lors de l’envoi de l’e-mail. Réessayez plus tard.");
  }
};


  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="hidden md:flex md:w-1/2 bg-black text-white items-center justify-center p-12">
          <div className="max-w-md text-left space-y-6">
            <img
              src={LogoCreditXWhite}
              alt="CreditX"
              className="h-16 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
            <p className="text-lg font-medium">L’hypothèque intelligente.</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <div
              className="mb-4 md:hidden text-center cursor-pointer"
              onClick={() => navigate("/")}
            ></div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {forgotPassword
                  ? "Mot de passe oublié"
                  : isRegister
                  ? "Créer un compte"
                  : title}
              </h2>
            </div>

            {verificationSent ? (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900">
      🎉 Presque terminé !
    </h3>
    <p className="text-base text-gray-700">
      Un e-mail de confirmation a été envoyé à <br />
      <span className="font-medium text-blue-600 break-words">{emailToConfirm}</span>

    </p>
    <p className="text-sm text-gray-500">
      Cliquez sur le lien dans votre boîte mail pour activer votre compte,
      puis revenez ici pour vous connecter.<br></br>
      <span className="text-creditxblue font-medium">
        Vérifiez aussi votre dossier spam </span>
        si vous ne trouvez pas l'email.
    </p>

    <div className="space-y-3">
      <button
        onClick={handleResendVerification}
        className="w-full bg-black text-white py-3 px-6 rounded-full text-base font-semibold hover:bg-gray-900 transition"
      >
        Renvoyer l’e-mail
      </button>

      <button
        onClick={() => {
          setIsRegister(false);
          setVerificationSent(false);
        }}
        className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-full text-base font-medium hover:bg-gray-50 transition"
      >
        Retour à la connexion
      </button>
    </div>
  </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-lg border border-gray-300 px-6 py-4 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-200 placeholder-gray-400"
                />

                {!forgotPassword && (
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-lg border border-gray-300 px-6 py-4 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-200 placeholder-gray-400"
                  />
                )}

                {isRegister && !forgotPassword && (
                  <input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full text-lg border border-gray-300 px-6 py-4 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-200 placeholder-gray-400"
                  />
                )}

                {errorMsg && (
                  <p className="text-sm text-red-500 text-center">{errorMsg}</p>
                )}
                {successMsg && (
                  <p className="text-sm text-green-600 text-center">{successMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-900 transition w-full"
                >
                  {loading
                    ? "Chargement..."
                    : forgotPassword
                    ? "Envoyer le lien"
                    : isRegister
                    ? "S'inscrire"
                    : "Se connecter"}
                </button>

                {!forgotPassword && (
                  <div className="text-center space-y-2 text-base">
                    <p
                      onClick={() => {
                        setForgotPassword(true);
                        setErrorMsg("");
                        setSuccessMsg("");
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </p>
                    <p
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setErrorMsg("");
                        setSuccessMsg("");
                        setVerificationSent(false);
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      {isRegister
                        ? "Déjà inscrit ? Se connecter"
                        : "Pas encore de compte ? S'inscrire"}
                    </p>
                  </div>
                )}

                {forgotPassword && (
                  <p
                    onClick={() => {
                      setForgotPassword(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-base text-center text-gray-600 hover:underline cursor-pointer"
                  >
                    Retour à la connexion
                  </p>
                )}
              </form>
            )}
          </div>

          <footer className="mt-12 text-center text-sm text-gray-400 w-full">
            <img
              src={LogoCreditXGrey}
              alt="CreditX"
              className="h-10 cursor-pointer mx-auto mb-3"
              onClick={() => navigate("/")}
            />
            <div className="flex justify-center gap-4 text-xs mb-1">
              <button onClick={() => navigate("/")} className="hover:underline">
                Accueil
              </button>
              <button
                onClick={() => navigate("/mentions-legales")}
                className="hover:underline"
              >
                Mentions légales
              </button>
            </div>
            <p className="text-[11px]">
              &copy; {new Date().getFullYear()} CreditX. Tous droits réservés.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
