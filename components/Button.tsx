import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  ...props 
}) => {
  // 3D Game Button Styles
  const baseStyles = "relative font-black rounded-2xl transition-all transform active:translate-y-2 active:border-b-0 outline-none flex items-center justify-center gap-2 group";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-base border-b-4 active:mt-1",
    md: "px-6 py-3 text-xl border-b-[6px] active:mt-[6px]",
    lg: "px-8 py-5 text-2xl border-b-[8px] active:mt-[8px]",
    xl: "px-10 py-6 text-3xl border-b-[10px] active:mt-[10px]"
  };

  const variants = {
    primary: "bg-blue-400 border-blue-600 text-white hover:bg-blue-300",
    secondary: "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
    danger: "bg-red-400 border-red-700 text-white hover:bg-red-300",
    success: "bg-emerald-400 border-emerald-700 text-white hover:bg-emerald-300",
    warning: "bg-yellow-400 border-yellow-600 text-yellow-900 hover:bg-yellow-300",
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizeStyles[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};