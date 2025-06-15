import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

const AvantageSlide = ({ title, text, index, sectionRefs }) => {
  const ref = useRef();
  sectionRefs.current[index] = ref;

  const inView = useInView(ref, { threshold: 0.5 });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, scale: 1, filter: 'blur(0px)' });
    } else {
      controls.start({ opacity: 0, scale: 0.98, filter: 'blur(6px)' });
    }
  }, [inView, controls]);

  return (
    <section
      ref={ref}
      className="h-screen flex items-center justify-center text-center px-4 md:px-20"
    >
      <motion.div
        animate={controls}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-white max-w-3xl bg-black/30 backdrop-blur-md px-6 py-8 rounded-xl"
      >
        <h2 className="text-4xl md:text-6xl font-extrabold mb-6">{title}</h2>
        <p className="text-lg md:text-2xl">{text}</p>
      </motion.div>
    </section>
  );
};

export default AvantageSlide;
