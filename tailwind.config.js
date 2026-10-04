/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/client/index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bull: "#22c55e",
        bear: "#ef4444",
        neutralbias: "#9ca3af",
      },
    },
  },
  plugins: [],
};
