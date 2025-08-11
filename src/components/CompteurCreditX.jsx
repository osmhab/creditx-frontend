import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

// Variants d'animation dépendants de la direction (+1/-1)
const numberVariants = {
  initial: (dir) => ({ y: dir > 0 ? 8 : -8, opacity: 0 }),
  animate: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? -8 : 8, opacity: 0 }),
};
const numberTransition = { duration: 0.11, ease: [0.25, 0.8, 0.25, 1] };

/**
 * CompteurCreditX — compteur réutilisable (design CreditX) pour incrémenter/décrémenter un entier.
 *
 * ✅ Incrément au press (PointerDown) + répétition en maintien
 * ✅ Pas de double step (onClick neutralisé)
 * ✅ Animation directionnelle lissée (variants + mode="wait")
 * ✅ Accessibilité clavier et ARIA
 */
export default function CompteurCreditX({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  helperText,
  error,
  disabled = false,
  size = "md",
  className = "",
  ariaLabelMinus = "Diminuer",
  ariaLabelPlus = "Augmenter",
}) {
  const [internal, setInternal] = useState(value ?? 0);
  const repeatRef = useRef(null);
  const directionRef = useRef(0); // +1 ou -1 selon le dernier mouvement
  const containerRef = useRef(null);

  useEffect(() => setInternal(value ?? 0), [value]);

  const height = size === "lg" ? "h-14" : "h-12";
  const textSize = size === "lg" ? "text-lg" : "text-base";
  const btnSize = size === "lg" ? "h-10 w-10" : "h-9 w-9";

  const canDec = !disabled && internal > min;
  const canInc = !disabled && internal < max;

  const clamp = (n) => Math.min(max, Math.max(min, n));

  function commit(n) {
    const next = clamp(n);
    setInternal((prev) => (prev === next ? prev : next));
    if (next !== value) onChange(next);
  }

  function stepBy(delta) {
    const d = Math.sign(delta) || 1;
    directionRef.current = d; // pour piloter l'animation
    commit(internal + d * step);
  }

  function startRepeat(delta) {
    stepBy(delta); // premier step au press
    clearRepeat();
    // première répétition après 300ms, puis toutes les 60ms
    repeatRef.current = setTimeout(function tick() {
      stepBy(delta);
      repeatRef.current = setTimeout(tick, 60);
    }, 300);
  }

  function clearRepeat() {
    if (repeatRef.current) {
      clearTimeout(repeatRef.current);
      repeatRef.current = null;
    }
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (["ArrowUp", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      stepBy(+1);
    } else if (["ArrowDown", "ArrowLeft"].includes(e.key)) {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      directionRef.current = -1;
      commit(min);
    } else if (e.key === "End") {
      e.preventDefault();
      directionRef.current = +1;
      commit(max);
    }
  }

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-900">{label}</label>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}

      <div
        className={`flex items-center justify-between rounded-2xl bg-gray-100 px-2 ${height} ring-1 ring-transparent focus-within:ring-black/20`}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={internal}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* Bouton - */}
        <button
          type="button"
          disabled={!canDec}
          aria-label={ariaLabelMinus}
          onPointerDown={(e) => {
            e.preventDefault();
            if (!canDec) return;
            startRepeat(-1);
          }}
          onPointerUp={clearRepeat}
          onPointerLeave={clearRepeat}
          onPointerCancel={clearRepeat}
          onClick={(e) => e.preventDefault()} // neutralise le click pour éviter le double step
          className={`rounded-full ${btnSize} flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white active:scale-[0.97]`}
        >
          <Minus className="h-5 w-5" />
        </button>

        {/* Valeur animée */}
        <div
          className={`relative overflow-hidden ${textSize} font-semibold tabular-nums text-gray-900 select-none`}
          aria-live="polite"
          style={{ willChange: "transform, opacity" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={internal}
              custom={directionRef.current}
              variants={numberVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={numberTransition}
              className="absolute left-0 right-0 mx-auto w-8 text-center"
              style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
            >
              {internal}
            </motion.span>
          </AnimatePresence>
          {/* Réserve l'espace pour éviter tout reflow horizontal */}
          <span className="invisible inline-block w-8 text-center">{internal}</span>
        </div>

        {/* Bouton + */}
        <button
          type="button"
          disabled={!canInc}
          aria-label={ariaLabelPlus}
          onPointerDown={(e) => {
            e.preventDefault();
            if (!canInc) return;
            startRepeat(+1);
          }}
          onPointerUp={clearRepeat}
          onPointerLeave={clearRepeat}
          onPointerCancel={clearRepeat}
          onClick={(e) => e.preventDefault()}
          className={`rounded-full ${btnSize} flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white active:scale-[0.97]`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {(helperText || error) && (
        <p className={`mt-2 text-xs ${error ? "text-red-500" : "text-gray-500"}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
