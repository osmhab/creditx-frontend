// src/components/EtapeCard.js
import React from "react";
import { motion } from "framer-motion";

const EtapeCard = ({ emoji, titre, texte, delay }) => {
  return (
    <motion.div
      className="bg-white rounded-3xl shadow-xl p-6 text-left flex flex-col items-start hover:scale-[1.03] transition-transform duration-300"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="text-4xl bg-blue-100 text-blue-600 rounded-full p-3 mb-4">
        {emoji}
      </div>
      <h3 className="text-xl font-bold mb-2">{titre}</h3>
      <p className="text-gray-600">{texte}</p>
    </motion.div>
  );
};

export default EtapeCard;
