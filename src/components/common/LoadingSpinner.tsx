import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        {/* Pokeball design */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-1/2 bg-primary-red rounded-t-full top-0" />
          <div className="absolute w-full h-1/2 bg-white rounded-b-full bottom-0" />
          <div className="absolute w-full h-[2px] bg-gray-800 top-1/2 -translate-y-1/2" />
          <div className="absolute w-3 h-3 bg-white border-2 border-gray-800 rounded-full top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
        </div>
      </motion.div>
      
      {message && (
        <motion.p
          className="font-rajdhani text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}