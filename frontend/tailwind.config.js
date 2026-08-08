/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B1220",
        panel: "#121B2E",
        panel2: "#182238",
        border: "#22304A",
        ink: "#EDEFF5",
        muted: "#8B93A7",
        faint: "#5B6478",
        gold: "#F2B84B",
        teal: "#4FD9C5",
        rose: "#E8607A",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(242,184,75,0.25)",
      },
    },
  },
  plugins: [],
};
