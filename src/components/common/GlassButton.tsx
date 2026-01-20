import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type ButtonVariant = 'red' | 'blue' | 'green' | 'yellow' | 'gray';
type ButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  red: 'border-primary-red/30 hover:border-primary-red/50 shadow-neon-red hover:shadow-neon-red',
  blue: 'border-primary-blue/30 hover:border-primary-blue/50 shadow-neon-blue hover:shadow-neon-blue',
  green: 'border-green-500/30 hover:border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  yellow: 'border-yellow-500/30 hover:border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
  gray: 'border-gray-500/30 hover:border-gray-500/50 shadow-[0_0_20px_rgba(107,114,128,0.5)]',
};

const sizeStyles: Record<ButtonSize, string> = {
  small: 'px-4 py-2 text-sm',
  medium: 'px-6 py-3 text-base',
  large: 'px-8 py-4 text-lg',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'blue', size = 'medium', className, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={clsx(
          'relative overflow-hidden rounded-lg',
          'backdrop-blur-xl bg-glass-bg border',
          'font-orbitron font-bold uppercase tracking-wider text-white',
          'transition-all duration-300',
          variantStyles[variant],
          sizeStyles[size],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        disabled={disabled}
        {...props}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';