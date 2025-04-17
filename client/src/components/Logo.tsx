import React from "react";
import logoImage from "@/assets/dailypulse-logo.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoImage} 
        alt="DailyPulse Logo" 
        className="h-14 w-auto" 
      />
    </div>
  );
}