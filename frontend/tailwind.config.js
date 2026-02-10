/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark cybersecurity theme
        'cyber': {
          'dark': '#0a0e27',
          'darker': '#050814',
          'card': '#0f1629',
          'border': '#1a2332',
        },
        'matrix': {
          'green': '#00ff41',
          'dark': '#003b00',
        },
        'neon': {
          'blue': '#00d4ff',
          'cyan': '#00ffff',
          'purple': '#b026ff',
          'pink': '#ff006e',
          'red': '#ff0054',
        },
        'status': {
          'critical': '#ff0054',
          'high': '#ff4757',
          'warning': '#ffa502',
          'info': '#00d4ff',
          'success': '#00ff41',
          'normal': '#3742fa',
        }
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(176, 38, 255, 0.5)',
        'neon-red': '0 0 20px rgba(255, 0, 84, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 1), 0 0 30px rgba(0, 212, 255, 0.5)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}
