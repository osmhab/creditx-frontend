import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const options = {
  typeDemande: [
    "Achat d’un bien existant",
    "Achat d’un bien à construire",
    "Reprise d’un crédit existant",
  ],
  typeLogement: [
    "Résidence principale (Logement en propriété)",
    "Objet à rendement locatif",
  ],
  typeBien: [
    "Villa individuelle",
    "Appartement en PPE",
    "Maison jumelée",
  ],
};

const GOOGLE_MAPS_API_KEY = AIzaSyB5FQA2rgliDm_E2j4vsss_FmDXFU9_fY8; // Remplace par ta clé API

export default function EtapeInformationsBien() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    typeDemande: options.typeDemande[0],
    typeLogement: options.typeLogement[0],
    typeBien: options.typeBien[0],
    adresse: "",
  });
  const autoCompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autoCompleteRef.current.getPlace();
    if (place?.formatted_address) {
      setFormData({ ...formData, adresse: place.formatted_address });
    }
  };

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else console.log("Submit and go next step", formData);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        <button onClick={handleBack} className="mb-8 text-black">
          <ArrowBackIcon />
        </button>

        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Demande</h1>
            <p className="text-sm text-gray-600">
              Veuillez sélectionner le type de demande approprié.
            </p>
            <select
              value={formData.typeDemande}
              onChange={handleChange("typeDemande")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm"
            >
              {options.typeDemande.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Type de logement</h1>
            <p className="text-sm text-gray-600">
              Veuillez sélectionner le type de logement approprié.
            </p>
            <select
              value={formData.typeLogement}
              onChange={handleChange("typeLogement")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm"
            >
              {options.typeLogement.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Type de bien</h1>
            <p className="text-sm text-gray-600">
              Veuillez sélectionner le type de bien approprié.
            </p>
            <select
              value={formData.typeBien}
              onChange={handleChange("typeBien")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm"
            >
              {options.typeBien.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Adresse du bien</h1>
            <p className="text-sm text-gray-600">
              Veuillez inscrire l’adresse exacte du bien
            </p>
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
              <Autocomplete
                onLoad={(autocomplete) => (autoCompleteRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChanged}
              >
                <input
                  type="text"
                  placeholder="Adresse"
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm"
                />
              </Autocomplete>
            </LoadScript>
          </div>
        )}
      </div>

      <div className="w-full max-w-md mt-12">
        <button
          onClick={handleNext}
          className="w-full bg-black text-white py-3 rounded-full text-sm"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}