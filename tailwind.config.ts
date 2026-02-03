import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'body': ['1.0625rem', { lineHeight: '1.7' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom beach theme colors
        beach: {
          sand: "hsl(var(--beach-sand))",
          ocean: {
            light: "hsl(var(--ocean-light))",
            deep: "hsl(var(--ocean-deep))",
          },
          sunset: {
            coral: "hsl(var(--sunset-coral))",
            gold: "hsl(var(--sunset-gold))",
          },
          driftwood: "hsl(var(--driftwood))",
          seafoam: "hsl(var(--seafoam))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Staggered entry animations
        "stagger-fade-in": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "stagger-slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        // Shimmer loading
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        // Micro-interactions
        "wiggle": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
        "heart-burst": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "checkmark-draw": {
          from: { strokeDashoffset: "24" },
          to: { strokeDashoffset: "0" },
        },
        "ripple": {
          from: { transform: "scale(0)", opacity: "0.4" },
          to: { transform: "scale(4)", opacity: "0" },
        },
        // Map markers
        "marker-drop": {
          "0%": { transform: "translateY(-40px) rotate(-45deg)", opacity: "0" },
          "60%": { transform: "translateY(5px) rotate(-45deg)", opacity: "1" },
          "80%": { transform: "translateY(-3px) rotate(-45deg)" },
          "100%": { transform: "translateY(0) rotate(-45deg)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px 2px rgba(236, 72, 153, 0.3)" },
          "50%": { boxShadow: "0 0 15px 5px rgba(236, 72, 153, 0.5)" },
        },
        // Celebrations
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "stamp-in": {
          "0%": { transform: "scale(0.5) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.1) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "counter-flip": {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        // Tab transitions
        "slide-in-left": {
          from: { transform: "translateX(-20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-left": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(-20px)", opacity: "0" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(20px)", opacity: "0" },
        },
        // Ken Burns
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0, 0)" },
          "100%": { transform: "scale(1.08) translate(-1%, -1%)" },
        },
        // Breathing FAB
        "breathing": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        // Progress bar momentum
        "progress-fill": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "80%": { transform: "scaleX(1.02)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "day-expand": {
          "0%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(1.01)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "stagger-fade-in": "stagger-fade-in 0.4s ease-out forwards",
        "stagger-slide-in": "stagger-slide-in 0.3s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "wiggle": "wiggle 0.3s ease-in-out",
        "heart-burst": "heart-burst 0.4s ease-out",
        "checkmark-draw": "checkmark-draw 0.3s ease-out forwards",
        "ripple": "ripple 0.6s ease-out",
        "marker-drop": "marker-drop 0.5s ease-out forwards",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s ease-in-out forwards",
        "stamp-in": "stamp-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "counter-flip": "counter-flip 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "slide-out-left": "slide-out-left 0.25s ease-out",
        "slide-out-right": "slide-out-right 0.25s ease-out",
        "ken-burns": "ken-burns 8s ease-out forwards",
        "breathing": "breathing 3s ease-in-out infinite",
        "progress-fill": "progress-fill 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "day-expand": "day-expand 0.2s ease-out forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
