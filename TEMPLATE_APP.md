# Basic React App Template with Shared UI Components

## Overview
This template provides instructions for creating a basic React app with the same look and feel as the original application, including the header, footer, and file upload functionality.

## Setup Instructions

1. First, create a new React app with Vite and TypeScript:
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
```

2. Install required dependencies:
```bash
npm install @radix-ui/react-slot @radix-ui/react-toast class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
npm install -D tailwindcss postcss autoprefixer
```

3. Initialize Tailwind CSS:
```bash
npx tailwindcss init -p
```

## File Structure

Create the following file structure:
```
src/
  ├── components/
  │   ├── ui/
  │   │   ├── button.tsx
  │   │   ├── toast.tsx
  │   │   └── tooltip.tsx
  │   └── file-upload-section.tsx
  ├── lib/
  │   └── utils.ts
  ├── App.tsx
  ├── index.css
  └── main.tsx
```

## Configuration Files

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

### src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### src/components/ui/button.tsx
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### src/components/file-upload-section.tsx
```typescript
import { useRef, useState } from 'react';
import { Button } from "./ui/button"
import { Upload } from "lucide-react"

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void;
}

export function FileUploadSection({ onFileUpload }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <div className="w-[160px]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-full px-2 bg-white hover:bg-indigo-50 text-gray-700 flex items-center justify-center gap-1.5 shadow-sm border border-indigo-200 rounded-xl transition-colors group overflow-hidden"
        >
          <Upload className="h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
          <span className="text-sm font-medium text-gray-600 truncate">
            {selectedFileName || 'Upload file'}
          </span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
```

### src/App.tsx
```typescript
import { useState, useEffect } from 'react'
import { FileUploadSection } from './components/file-upload-section'
import { ToastProvider } from './components/ui/toast'

// Add mobile detection hook
const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return (
        (window.innerWidth <= 768 || window.screen.width <= 768) ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        /iPhone|iPod|Android/.test(navigator.platform) ||
        ('orientation' in window)
      );
    };

    const handleResize = () => setIsMobile(checkMobile());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile };
};

function App() {
  const { isMobile } = useDeviceDetect();

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file);
    // Handle file upload logic here
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                {isMobile ? (
                  <>
                    Analyze with AI
                    <div className="text-sm font-normal mt-1 text-white/90">
                      Upload your database for AI analysis
                    </div>
                  </>
                ) : (
                  <>
                    Analyze with AI
                    <div className="text-lg font-normal mt-2 text-white/90">
                      Upload your database for comprehensive AI analysis
                      <div className="text-sm mt-1">
                        Supports SQLite, PostgreSQL, MySQL, and more
                      </div>
                    </div>
                  </>
                )}
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <FileUploadSection onFileUpload={handleFileUpload} />
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white/50 border-t border-indigo-100 py-2 mt-8 text-sm text-indigo-950/70 text-center">
          <div className="max-w-7xl mx-auto px-4">
            Amar Harolikar <span className="mx-1.5 text-indigo-300">•</span> Specialist - Decision Sciences & Applied Generative AI <span className="mx-1.5 text-indigo-300">•</span>
            <a 
              href="https://www.linkedin.com/in/amarharolikar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              LinkedIn
            </a> <span className="mx-1.5 text-indigo-300">•</span>
            <a 
              href="https://rex.tigzig.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              rex.tigzig.com
            </a> <span className="mx-1.5 text-indigo-300">•</span>
            <a 
              href="https://tigzig.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              tigzig.com
            </a>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App
```

## Additional Components

The template includes basic versions of the following UI components:
- Button
- Toast notifications
- Tooltip
- File upload section

## Styling Notes

The app uses a consistent color scheme:
- Primary colors: Indigo (950, 900)
- Accent colors: Blue (50, 100)
- Text colors: White, Gray (600, 700)
- Border colors: Indigo (200, 300)

Key UI elements:
1. Header with gradient background
2. Clean, white content areas with rounded corners
3. Subtle shadows and borders
4. Responsive design for mobile and desktop

## File Upload Component Features

The file upload component includes:
1. Styled upload button with icon
2. File name display
3. Hidden file input
4. File type restrictions (.csv, .txt)
5. Hover effects and transitions

## Next Steps

1. Run `npm install` to install dependencies
2. Start the development server with `npm run dev`
3. Customize the header text and styling as needed
4. Implement the file upload logic in the `handleFileUpload` function
5. Add additional components and functionality as required

## Notes

- The template uses Tailwind CSS for styling
- Components are built using Radix UI primitives
- The design is responsive and mobile-friendly
- All components support dark mode (via the .dark class) 