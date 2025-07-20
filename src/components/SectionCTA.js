// src/components/SectionCTA.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const SectionCTA = () => {
  const navigate = useNavigate();

  const handleCTA = () => {
    const user = getAuth().currentUser;
    navigate(user ? '/dashboard' : '/login-client');
  };

  return (
    <section className="bg-black text-white py-24 px-6 md:px-12 flex items-center justify-center">
      <div className="text-center max-w-2xl flex flex-col items-center gap-6">
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
          Obtenez votre offre hypothécaire en moins de 48h
        </h2>
        <p className="text-lg text-gray-300">
          CreditX simplifie toutes les démarches, vous comparez les banques et signez en ligne, sans pression.
        </p>
        <button
          onClick={handleCTA}
          className="bg-white text-black px-8 py-4 rounded-full text-base font-semibold hover:bg-gray-200 transition"
        >
          Commencez maintenant
        </button>
      </div>
    </section>
  );
};

export default SectionCTA;
