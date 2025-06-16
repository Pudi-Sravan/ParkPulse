/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")], 
  theme: {
    extend: {
      colors: {
        background: "#0F0D23",
        primary: "#00FFFF",
        secondary: "#A8B5DB",
        surface: "#1C1A33",
        textDark: "#151312",
      },
    },
  },
  plugins: [],
};
