/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        paper: "rgb(var(--color-paper-rgb) / <alpha-value>)",
        "paper-2": "var(--color-paper-2)",
        card: "rgb(var(--color-card-rgb) / <alpha-value>)",
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        // Semantic aliases (cream identity)
        bg: "rgb(var(--color-paper-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-card-rgb) / <alpha-value>)",
        text: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        // Brand
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        lime: "var(--color-lime)",
        magenta: "var(--color-magenta)",
        cyan: "var(--color-cyan)",
        red: "var(--color-red)",
        purple: "var(--color-purple)",
        teal: "var(--color-teal)",
        amber: "var(--color-amber)",
        // Legacy accent aliases
        "accent-green": "var(--color-lime)",
        "accent-pink": "var(--color-magenta)",
        "accent-cyan": "var(--color-cyan)",
        "accent-red": "var(--color-red)",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["FuturaStd", "Poppins", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        card: "var(--r-card)",
        "card-lg": "var(--r-lg)",
        pill: "var(--r-pill)",
      },
      maxWidth: {
        wrap: "var(--maxw)",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(.2, .8, .2, 1)",
      },
    },
  },
  plugins: [],
};
