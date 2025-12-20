/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        morandi: {
          base: "#F7F8FA",
          card: "#FFFFFF",
          text: {
            primary: "#2D3142",
            secondary: "#6B7280",
            accent: "#1F2937",
            muted: "#9CA3AF"
          },
          blue: {
            50: "#F0F4F8",
            100: "#D8E2DC",
            200: "#B8C5C8",
            300: "#9DA9B3",
            400: "#8B9CAB",
            500: "#7C90A0",
            600: "#5D7080",
            700: "#4A5568"
          },
          green: {
            50: "#F0FDF4",
            100: "#E6EFEC",
            200: "#C9DBD6",
            400: "#68D391",
            500: "#95B8A8",
            600: "#7A9E8E"
          },
          beige: {
            50: "#FFFBF5",
            100: "#F9F7F2",
            200: "#EFEDE6",
            500: "#DBCAB0",
            600: "#BFA88F"
          },
          orange: {
            50: "#FFF7ED",
            100: "#FAEBE6",
            400: "#FB923C",
            500: "#E0B1A6",
            600: "#C99185"
          },
          purple: {
            50: "#FAF5FF",
            100: "#F3E8FF",
            500: "#A78BFA",
            600: "#9333EA"
          }
        },
        // Premium accent colors
        accent: {
          primary: "#4F46E5",    // Indigo
          secondary: "#0EA5E9",  // Sky blue
          success: "#10B981",    // Emerald
          warning: "#F59E0B",    // Amber
          danger: "#EF4444",     // Red
        }
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans TC"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(79, 70, 229, 0.15)',
        'glow-sm': '0 0 10px rgba(79, 70, 229, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}