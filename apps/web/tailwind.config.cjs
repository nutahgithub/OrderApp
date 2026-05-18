/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{ts,tsx}"]
  },
  safelist: [
    "connection-pill--connected",
    "connection-pill--connecting",
    "connection-pill--fallback",
    "connection-pill--idle",
    "order-row--active",
    "status-pill--available",
    "status-pill--occupied",
    "status-pill--disabled",
    "status-pill--order-pending",
    "status-pill--order-confirmed",
    "status-pill--order-preparing",
    "status-pill--order-ready",
    "status-pill--order-served",
    "status-pill--order-paid",
    "status-pill--order-cancelled",
    "order-action-button--confirmed",
    "order-action-button--preparing",
    "order-action-button--ready",
    "order-action-button--served",
    "order-action-button--cancelled"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        floating: "var(--shadow-floating)"
      }
    }
  },
  plugins: []
};
