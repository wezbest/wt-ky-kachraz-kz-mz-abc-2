// tailwind.config.js
/** @type {import('tailwindcss').Config} */
// Remove the import line for tailwindcss-animated

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "synthwave-purple": "#bf24f4",
        "synthwave-pink": "#ff2aca",
        "synthwave-blue": "#0ff0fc",
        "synthwave-dark": "#1a1a2e",
        "synthwave-darker": "#0d0d1a", // Keep this
        "synthwave-grid": "#2a2a4a",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        // Test simplifying these too, just in case
        synth: "0 0 10px #bf24f4, 0 0 20px #ff2aca", // Hardcode colors
        "synth-inner": "inset 0 0 10px #0ff0fc", // Hardcode colors
        // If the above works, the issue might be nested theme() calls
      },
    },
  },
  plugins: [
    // Remove tailwindcssAnimated from here
  ],
}
