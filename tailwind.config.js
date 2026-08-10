/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6842A0", 50: "#F2ECF8", 100: "#E5D9F1", 600: "#6842A0", 700: "#52347E" },
        school: { DEFAULT: "#B42335", 50: "#FCECEF", 100: "#F7D5DA", 600: "#B42335" },
        lavender: { 50: "#F2ECF8", 100: "#E5D9F1" },
      },
    },
  },
  plugins: [],
}
