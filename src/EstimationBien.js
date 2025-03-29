import React, { useState } from 'react';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

function EstimationBien() {
  const [localisation, setLocalisation] = useState('');
  const [surface, setSurface] = useState('');
  const [standing, setStanding] = useState('standard');
  const [anneeConstruction, setAnneeConstruction] = useState('');
  const [surfaceTerrain, setSurfaceTerrain] = useState('');
  const [prixSouhaite, setPrixSouhaite] = useState('');
  const [nombrePieces, setNombrePieces] = useState('');
  const [terrasse, setTerrasse] = useState('');
  const [piscine, setPiscine] = useState(false);
  const [ascenseur, setAscenseur] = useState(false);
  const [etages, setEtages] = useState('');
  const [averageValue, setAverageValue] = useState('');
  const [lowerValue, setLowerValue] = useState('');
  const [upperValue, setUpperValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const estimerValeur = async () => {
    if (!localisation || !surface || !anneeConstruction || !surfaceTerrain || !prixSouhaite) {
      alert("Merci de remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5050/estimation', {
        localisation,
        surface,
        standing,
        annee: anneeConstruction,
        terrain: surfaceTerrain,
        prixSouhaite,
        nombrePieces,
        terrasse,
        piscine,
        ascenseur,
        etages
      });

      setAverageValue(res.data.averageValue);
      setLowerValue(res.data.lowerValue);
      setUpperValue(res.data.upperValue);
      setWarningMessage(res.data.warningMessage);
      setSuccessMessage(res.data.successMessage);

    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'estimation.');
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Estimation de bien immobilier (IA)</h1>

      <div>
        <label>Localisation :</label>
        <input type="text" value={localisation} onChange={(e) => setLocalisation(e.target.value)} />
      </div>

      <div>
        <label>Surface habitable (m²) :</label>
        <input type="number" value={surface} onChange={(e) => setSurface(e.target.value)} />
      </div>

      <div>
        <label>Surface du terrain (m²) :</label>
        <input type="number" value={surfaceTerrain} onChange={(e) => setSurfaceTerrain(e.target.value)} />
      </div>

      <div>
        <label>Année de construction :</label>
        <input type="number" value={anneeConstruction} onChange={(e) => setAnneeConstruction(e.target.value)} />
      </div>

      <div>
        <label>Standing :</label>
        <select value={standing} onChange={(e) => setStanding(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="bon">Bon</option>
          <option value="haut">Haut de gamme</option>
        </select>
      </div>

      {/* Ajout d'un champ avec un masque pour le prix souhaité */}
      <div>
        <label>Prix souhaité :</label>
        <NumericFormat 
          value={prixSouhaite} 
          onChange={(e) => setPrixSouhaite(e.target.value)}
          thousandSeparator="'"
          prefix=""
          allowNegative={false}
        />
      </div>

      <div>
        <label>Nombre de pièces :</label>
        <input type="number" value={nombrePieces} onChange={(e) => setNombrePieces(e.target.value)} />
      </div>

      <div>
        <label>Terrasse (m²) :</label>
        <input type="number" value={terrasse} onChange={(e) => setTerrasse(e.target.value)} />
      </div>

      <div>
        <label>Piscine :</label>
        <input type="checkbox" checked={piscine} onChange={(e) => setPiscine(e.target.checked)} />
      </div>

      <div>
        <label>Ascenseur :</label>
        <input type="checkbox" checked={ascenseur} onChange={(e) => setAscenseur(e.target.checked)} />
      </div>

      <div>
        <label>Nombre d'étages :</label>
        <input type="number" value={etages} onChange={(e) => setEtages(e.target.value)} />
      </div>

      {/* Slider pour le prix souhaité */}
      <div>
        <input
          type="range"
          min="0"
          max="5000000"
          value={prixSouhaite}
          onChange={(e) => setPrixSouhaite(e.target.value)}
          step="10000"
        />
      </div>

      <button onClick={estimerValeur}>Estimer</button>

      {loading && <p>⏳ Estimation en cours...</p>}

      {averageValue && lowerValue && upperValue && (
        <div style={{ marginTop: '20px' }}>
          <h3>Estimation en CHF :</h3>
          <ul>
            <li><strong>Valeur moyenne estimée :</strong> {averageValue} CHF</li>
            <li><strong>Valeur inférieure estimée :</strong> {lowerValue} CHF</li>
            <li><strong>Valeur supérieure estimée :</strong> {upperValue} CHF</li>
          </ul>
        </div>
      )}

      {warningMessage && (
        <div style={{ color: 'red', marginTop: '20px' }}>
          <p>{warningMessage}</p>
        </div>
      )}

      {successMessage && (
        <div style={{ color: 'green', marginTop: '20px' }}>
          <p>{successMessage}</p>
        </div>
      )}
    </div>
  );
}

export default EstimationBien;
