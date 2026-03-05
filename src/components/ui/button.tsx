import * as React from "react"

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
}

function Button({
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const variantClass = `button-${variant}`;
  const sizeClass = `button-${size}`;
  
  return (
    <button
      className={`button ${variantClass} ${sizeClass} ${className}`}
      {...props}
    />
  )
}

export { Button }
