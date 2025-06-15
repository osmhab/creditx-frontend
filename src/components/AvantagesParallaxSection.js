// src/components/AvantagesParallaxSection.js
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import digitalImage from '../assets/avantage-digital.jpg';
import banquesImage from '../assets/avantage-banques.jpg';
import graphiqueImage from '../assets/avantage-graphique.jpg';
import AvantageSlide from './AvantageSlide';

const slides = [
  {
    image: digitalImage,
    title: "100% digital",
    text: "Gagnez un temps précieux grâce à un processus entièrement en ligne. De la simulation à la signature notariée, tout est centralisé dans une interface intuitive, sans papier ni déplacement. CreditX vous permet de suivre, signer et valider chaque étape depuis votre smartphone ou votre ordinateur, à tout moment."
  },
  {
    image: banquesImage,
    title: "Accès direct aux banques",
    text: "Inutile de démarcher chaque établissement. Dès que votre dossier est prêt, il est automatiquement transmis à nos partenaires bancaires. Vous recevez plusieurs offres personnalisées, dans des délais records, et sans aucune pression commerciale. CreditX vous donne le pouvoir de comparer en toute liberté."
  },
  {
    image: graphiqueImage,
    title: "Transparence totale",
    text: "Visualisez vos options clairement : taux, mensualités, frais annexes… tout est présenté dans une interface lisible et interactive. Mais la transparence ne s’arrête pas là. Vos données sont stockées et transmises de manière ultra sécurisée, avec un chiffrement de bout en bout. Chez CreditX, la confidentialité de vos informations est une priorité absolue."
  }
];

const AvantagesParallaxSection = () => {
  const sectionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      sectionRefs.current.forEach((ref, index) => {
        if (ref && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setActiveIndex(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="relative w-full">
      {/* Sticky background image */}
      <div className="sticky top-0 h-screen w-full z-0">
        {slides.map((slide, i) => (
          <motion.img
            key={i}
            src={slide.image}
            alt={`slide-${i}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
            initial={{ opacity: 0 }}
            animate={{ opacity: i === activeIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />
      </div>

      {/* Scrollable sections */}
      <div className="relative z-20">
        {slides.map((slide, i) => (
          <AvantageSlide
            key={i}
            title={slide.title}
            text={slide.text}
            index={i}
            sectionRefs={sectionRefs}
          />
        ))}
      </div>

      {/* Barre de progression verticale */}
      <motion.div
        className="fixed right-6 top-1/2 -translate-y-1/2 w-1 h-64 bg-white bg-opacity-20 rounded-full z-50"
        style={{ transformOrigin: 'top', scaleY }}
      />
    </div>

  );
};

export default AvantagesParallaxSection;
