/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // tes fichiers sont dedans
    "./pages/**/*.{js,jsx,ts,tsx}", // si tu as des pages hors src (facultatif)
    "./components/**/*.{js,jsx,ts,tsx}", // idem
  ],
  theme: {
    extend: {
      colors: {
        creditxblue: "#001BFF",
      },
      // Optionnel: si tu veux l'anim slide-down que tu avais évoquée
      keyframes: {
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-down": "slideDown 0.3s ease-out",
      },
    },
  },
  plugins: [],
}
