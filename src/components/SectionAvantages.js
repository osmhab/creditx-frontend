// src/components/SectionAvantages.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import digitalIllustration from '../assets/illustration-digital.svg';
import banquesIllustration from '../assets/illustration-banques.svg';
import transparenceIllustration from '../assets/illustration-transparence.svg';

const slides = [
  {
    image: digitalIllustration,
    title: "100% digital",
    text: "De la demande à la signature, tout se fait en ligne. Plus besoin de rendez-vous physiques : gagnez du temps.",
    accent: 'blue',
  },
  {
    image: banquesIllustration,
    title: "Accès direct aux banques",
    text: "Inutile de démarcher chaque établissement. Dès que votre dossier est prêt, il est automatiquement transmis à nos partenaires bancaires. Vous recevez plusieurs offres personnalisées, dans des délais records, et sans aucune pression commerciale. CreditX vous donne le pouvoir de comparer en toute liberté.",
    accent: 'purple',
  },
  {
    image: transparenceIllustration,
    title: "Transparence totale",
    text: "Visualisez vos options clairement : taux, mensualités, frais annexes… tout est présenté dans une interface lisible et interactive. Mais la transparence ne s’arrête pas là. Vos données sont stockées et transmises de manière ultra sécurisée, avec un chiffrement de bout en bout. Chez CreditX, la confidentialité de vos informations est une priorité absolue.",
    accent: 'green',
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
};

const SectionAvantages = () => {
  const navigate = useNavigate();
  const sectionRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleCTA = () => {
  const user = getAuth().currentUser;
  navigate(user ? "/dashboard" : "/login-client");
};


  useEffect(() => {
    const handleScroll = () => {
      sectionRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const inMiddle = rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2;
          if (inMiddle) setActiveIndex(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full relative">
      {/* Pagination dynamique */}
      <div className="hidden md:flex flex-col gap-4 fixed top-1/2 right-6 -translate-y-1/2 z-50">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-3 h-3 bg-black' : 'bg-gray-400 opacity-50'
            }`}
          />
        ))}
      </div>

      {slides.map((slide, i) => (
        <section
          key={i}
          ref={(el) => (sectionRefs.current[i] = el)}
          className={`bg-gray-50 h-screen w-full flex items-center justify-center px-6 md:px-12 border-y border-gray-200 shadow-inner`}
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            custom={i}
            className="max-w-6xl w-full flex flex-col-reverse md:flex-row items-center md:items-start gap-8 md:gap-12"
          >
            {/* Texte (mobile = en bas / desktop = à gauche) */}
            <div className="text-center md:text-left flex flex-col justify-center items-center md:items-start gap-6 max-w-xl">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                {slide.title}
              </h2>
              <p className="text-gray-700 text-base md:text-lg">{slide.text}</p>
              <button
                onClick={handleCTA}
                className="px-8 py-3 rounded-full text-base font-semibold text-white bg-black hover:bg-gray-900 transition"
              >
                Commencez maintenant
              </button>
            </div>

            {/* Image (mobile = en haut / desktop = à droite) */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-40 h-40 md:w-[450px] md:h-auto object-contain"
            />
          </motion.div>
        </section>
      ))}
    </div>
  );
};

export default SectionAvantages;
