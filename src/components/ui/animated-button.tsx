import React from 'react';
import { cn } from "../../lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button 
        ref={ref}
        className={cn("relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-medium transition-all bg-white rounded-full hover:bg-white group outline outline-1 outline-white/20 disabled:opacity-50 disabled:cursor-not-allowed", className)}
        {...props}
      >
        <span className="w-48 h-48 rounded rotate-[-40deg] bg-zinc-800 absolute bottom-0 left-0 -translate-x-full ease-out duration-500 transition-all translate-y-full mb-9 ml-9 group-hover:ml-0 group-hover:mb-32 group-hover:translate-x-0"></span>
        <span className="relative w-full text-center text-black transition-colors duration-300 ease-in-out group-hover:text-white flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";
