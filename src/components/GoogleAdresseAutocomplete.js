import React, { useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

export default function GoogleAdresseAutocomplete({ formData, setFormData, user }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector("gmp-place-autocomplete");
    if (!el) return;

    const handlePlaceChange = async (e) => {
      const place = e.detail;
      if (!place || !place.formatted_address) return;

      const get = (type) =>
        place.address_components?.find((c) => c.types.includes(type))?.long_name || "";

      const updated = {
        ...formData,
        adresseComplete: place.formatted_address,
        rueNumero: `${get("route")} ${get("street_number")}`.trim(),
        localite: get("locality") || get("postal_town"),
        npa: get("postal_code"),
        latitude: place.geometry?.location?.lat || null,
        longitude: place.geometry?.location?.lng || null,
      };

      setFormData(updated);

      if (user) {
        const ref = doc(db, "dossiers", user.uid);
        try {
          await updateDoc(ref, updated);
        } catch (err) {
          console.error("Erreur lors de l'enregistrement de l'adresse dans Firestore:", err);
        }
      }
    };

    el.addEventListener("placechange", handlePlaceChange);
    return () => el.removeEventListener("placechange", handlePlaceChange);
  }, [formData, setFormData, user]);

  return (
    <div ref={containerRef} style={{ marginBottom: "24px" }}>
      <gmp-place-autocomplete
        style={{ width: "100%", height: "56px", display: "block" }}
        placeholder="Adresse complète"
        autocomplete="street-address"
      ></gmp-place-autocomplete>
    </div>
  );
}