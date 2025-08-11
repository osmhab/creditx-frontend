import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoCreditXWhite from "../assets/logo-creditx-white.svg";
import LogoCreditXGrey from "../assets/logo-creditx-grey.svg";
import { getFunctions, httpsCallable } from "firebase/functions";



export default function ContactFormPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validate = () => {
    if (!email || !message) return "Merci de remplir tous les champs.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Adresse e-mail invalide.";
    if (message.trim().length < 10) return "Le message doit contenir au moins 10 caractères.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);
      const functions = getFunctions();
      const sendContactEmail = httpsCallable(functions, "sendContactEmail");
      await sendContactEmail({ fromEmail: email, message });
      setSuccessMsg("Votre message a bien été envoyé. Nous vous répondrons rapidement.");
      setEmail("");
      setMessage("");

    } catch (err) {
      console.error("sendContactEmail error:", err);
      const code = err?.code || "unknown";
      const msg = err?.message || "Une erreur inconnue est survenue.";
      if (code === "failed-precondition") {
        setErrorMsg("Vérification App Check requise. Rechargez la page et réessayez.");
      } else if (code === "invalid-argument") {
        setErrorMsg(msg.replace("functions.https.HttpsError: ", ""));
      } else {
        setErrorMsg("Impossible d'envoyer votre message pour le moment. Réessayez plus tard.");
      }
     } finally {
       setLoading(false);
     }
   };


  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Colonne gauche identique (desktop/tablette) */}
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

        {/* Colonne droite avec formulaire centré – mêmes largeurs/espacements */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <div
              className="mb-4 md:hidden text-center cursor-pointer"
              onClick={() => navigate("/")}
            ></div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Contact</h2>
              <p className="mt-2 text-gray-600 text-base">
                Une question, un projet ? Écrivez-nous.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-lg border border-gray-300 px-6 py-4 rounded-full focus:outline-none focus:ring-4 focus:ring-gray-200 placeholder-gray-400"
              />

              <textarea
                placeholder="Votre message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full text-lg border border-gray-300 px-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-gray-200 placeholder-gray-400 resize-y"
              />

              {errorMsg && (
                <p className="text-sm text-red-500 text-center">{errorMsg}</p>
              )}
              {successMsg && (
                <p className="text-sm text-green-600 text-center">{successMsg}</p>
              )}

              <button
  type="submit"
  disabled={loading}
  className="relative bg-black text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-900 transition w-full overflow-hidden"
>
  {loading ? (
    <>
      <span className="absolute inset-0 bg-gray-700 animate-[progressFill_1.5s_linear_infinite]" />
      <span className="relative z-10">Envoi…</span>
    </>
  ) : (
    "Envoyer"
  )}
</button>

<style>
{`
@keyframes progressFill {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`}
</style>


              <p
                onClick={() => navigate("/")}
                className="text-base text-center text-blue-600 hover:underline cursor-pointer"
              >
                Retour à l’accueil
              </p>
            </form>
          </div>

          {/* Footer identique */}
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
