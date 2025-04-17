import React from "react";
import logoImage from "@/assets/dailypulse-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
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
    sm: "h-8",
    md: "h-10",
    lg: "h-16",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoImage}
        alt="DailyPulse Logo"
        className={`${sizeClasses[size]} w-auto mr-2`}
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