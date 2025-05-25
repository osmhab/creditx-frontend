import React, { useEffect, useRef, useState } from "react";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { Box, Button } from "@mui/material";

export default function GoogleAdresseAutocomplete({ onAdresseValidee, user }) {
  const containerRef = useRef(null);
  const [localData, setLocalData] = useState({});
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const handlePlace = async (place) => {
    if (!place || !place.formatted_address) return;

    const get = (type) =>
      place.address_components?.find((c) => c.types.includes(type))?.long_name || "";

    const updated = {
      adresseComplete: place.formatted_address ?? "",
      rueNumero: `${get("route")} ${get("street_number")}`.trim(),
      localite: get("locality"),
      npa: get("postal_code"),
      latitude: place.geometry?.location?.lat?.() ?? null,
      longitude: place.geometry?.location?.lng?.() ?? null,
    };

    onAdresseValidee(updated);
    setLocalData(updated);

    if (user) {
      try {
        const ref = doc(db, "dossiers", user.uid);
        await updateDoc(ref, updated);
        await addDoc(collection(db, "bienImmobilier"), {
          ...updated,
          userId: user.uid,
          dateCreation: new Date(),
        });
      } catch (err) {
        // Firestore errors silencieuses (pas de console ici)
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current?.querySelector("gmp-place-autocomplete");
    if (!el) return;

    const handlePlaceChange = async (e) => {
      await handlePlace(e.detail);
    };

    el.addEventListener("placechange", handlePlaceChange);
    return () => {
      el.removeEventListener("placechange", handlePlaceChange);
    };
  }, [user]);

  const mapKey = `${localData.latitude || "default"}-${localData.longitude || "default"}`;

  return (
    <div ref={containerRef} style={{ marginBottom: "24px" }}>
      <label
        htmlFor="google-address-autocomplete"
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: "0.875rem",
          color: "#666",
          fontWeight: 500,
        }}
      >
        Adresse
      </label>

      <gmp-place-autocomplete
        id="google-address-autocomplete"
        style={{ width: "100%", height: "56px", display: "block" }}
        placeholder="Adresse complète"
        autocomplete="street-address"
      ></gmp-place-autocomplete>

      <div style={{ height: 250, width: "100%", marginTop: 16 }}>
        <iframe
          key={mapKey}
          title={`Google Map ${localData.latitude || "default"}`}
          width="100%"
          height="100%"
          style={{ border: 0, borderRadius: 8 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${localData.latitude || 46.8182},${localData.longitude || 8.2275}&zoom=${localData.latitude ? 17 : 7}&maptype=roadmap`}
        />
      </div>
    </div>
  );
}
