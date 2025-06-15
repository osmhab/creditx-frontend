// src/components/SectionFonctionnementVisuelle.js

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import formulaire from '../assets/formulaire.jpg';
import banques from '../assets/banques.jpg';
import signature from '../assets/signature.jpg';

const cards = [
  {
    title: "Formulaire rapide",
    subtitle: "Remplissez votre demande en 5 minutes",
    image: formulaire
  },
  {
    title: "Offres bancaires",
    subtitle: "Recevez plusieurs offres sous 48h",
    image: banques
  },
  {
    title: "Signature digitale",
    subtitle: "Finalisez tout en ligne, sans papier",
    image: signature
  }
];


const SectionFonctionnementVisuelle = () => {
  return (
    <section className="bg-white py-28 px-6 md:px-12 text-center min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-gray-900">
        Votre hypothèque, réimaginée.
      </h2>
      <p className="text-gray-600 text-lg mb-10 max-w-2xl">
        Comparez, choisissez et signez — tout depuis chez vous. Laissez CreditX vous simplifier le crédit immobilier.
      </p>

      <Link
        to="/formulaire"
        className="bg-black text-white text-base font-semibold rounded-full px-6 py-3 hover:scale-105 transition mb-16"
      >
        Démarrer maintenant
      </Link>

      <div className="flex flex-col md:flex-row gap-6 justify-center">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden w-full md:w-80"
          >
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-52 object-cover"
            />
            <div className="p-6 text-left">
              <h3 className="text-xl font-bold mb-2 text-gray-900">{card.title}</h3>
              <p className="text-gray-600 text-sm">{card.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default SectionFonctionnementVisuelle;