import { motion } from 'framer-motion';
import clsx from 'clsx';

interface HealthBarProps {
  current: number;
  max: number;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function HealthBar({ current, max, showText = true, size = 'medium' }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const sizeStyles = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4',
  };

  const getHealthColor = () => {
    if (percentage > 50) return 'health-bar-high';
    if (percentage > 20) return 'health-bar-medium';
    return 'health-bar-low';
  };

  return (
    <div className="w-full flex flex-col-reverse gap-1">
      { showText && (
        <div className="flex items-baseline gap-1">
          <span className="font-rajdhani text-xs text-gray-400 uppercase">HP</span>
          <span className="font-orbitron text-xs text-slate-100">{Math.max(0, current)}/{max}</span>
        </div>
      )}

      <div className={clsx(
        'relative w-full bg-black/50 rounded-full overflow-hidden',
        sizeStyles[size]
      )}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900" />
        
        {/* Health bar */}
        <motion.div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full',
            getHealthColor()
          )}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </div>
  );
}