// src/components/TroisEtapes.js
import React from 'react';
import Etape1 from '../assets/etape1.svg';
import Etape2 from '../assets/etape2.svg';
import Etape3 from '../assets/etape3.svg';
import { motion } from 'framer-motion';

const TroisEtapes = () => {
  const steps = [
    {
      text: "Remplissez le formulaire en ligne en moins de 2 min.",
      image: Etape1
    },
    {
      text: "Recevez des offres de plus de 50 banques.",
      image: Etape2
    },
    {
      text: "Comparez sur CreditX et choisissez votre offre en un clic.",
      image: Etape3
    }
  ];

  return (
    <section className="bg-white py-24 px-6 md:px-12 border-b border-gray-100">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-black">
          Comment ça marche ?
        </h2>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <motion.img
              src={step.image}
              alt={`Étape ${i + 1}`}
              className="w-32 h-32 object-contain"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
            />
            <p className="text-lg font-medium text-gray-800">
              {step.text}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TroisEtapes;
