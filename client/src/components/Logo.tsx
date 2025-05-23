import React from "react";
import logoImage from "@/assets/dailypulse-logo-transparent.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  className?: string;
  textClassName?: string;
}

export function Logo({ 
  size = "md", 
  withText = true, 
  className = "",
  textClassName = ""
}: LogoProps) {
  const sizeClasses = {
    sm: "h-10",
    md: "h-16",
    lg: "h-24",
    xl: "h-32",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoImage}
        alt="DailyPulse Logo"
        className={`${sizeClasses[size]} w-auto ${withText ? 'mr-2' : ''}`}
      />
      {withText && (
        <span className={`font-semibold text-gray-800 ${textClassName}`}>
          DailyPulse
        </span>
      )}
    </div>
  );
}

export default Logo;