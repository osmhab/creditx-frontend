import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const AvantageParallaxItem = ({ image, title, text, reverse }) => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Animation du texte et de l’image en entrée/sortie
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const translateY = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);

  return (
    <section
      ref={ref}
      className="relative h-screen w-full overflow-hidden flex items-center justify-center"
    >
      {/* Image de fond */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${image})`, opacity }}
      />

      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black bg-opacity-60 z-10" />

      {/* Texte animé */}
      <motion.div
        style={{ opacity, y: translateY }}
        className={`relative z-20 px-6 md:px-20 max-w-4xl text-white text-center ${reverse ? "md:text-right ml-auto" : "md:text-left"}`}
      >
        <h2 className="text-3xl md:text-6xl font-extrabold mb-6">{title}</h2>
        <p className="text-lg md:text-2xl">{text}</p>
      </motion.div>
    </section>
  );
};

export default AvantageParallaxItem;
