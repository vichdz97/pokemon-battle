import { memo } from 'react';
import { motion } from 'framer-motion';

interface RandomGridCardProps {
  onClick: () => void;
}

/**
 * Uses data-pokemon-id={-1} so SelectionToken's hit-testing picks it up the
 * same way it picks up real GridCards — the drop handlers in SelectionScreen
 * special-case -1.
 */
export const RandomGridCard = memo(function RandomGridCard({ onClick }: RandomGridCardProps) {
  return (
    <motion.div
      data-pokemon-id={-1}
      className="relative aspect-square flex items-center justify-center rounded-lg border-2 overflow-hidden cursor-pointer
                 bg-gradient-to-br from-tekken-panel to-tekken-dark border-tekken-gold/40
                 hover:border-tekken-gold hover:brightness-125 transition-all duration-150"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Sweeping shimmer */}
      <motion.div
        className="absolute inset-y-0 w-full opacity-20 pointer-events-none"
        style={{
          background: 'linear-gradient(110deg, transparent 0%, rgba(218,165,32,0.6) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className="absolute inset-0 bg-tekken-gold/5" />

      {/* "?" stands in for the sprite */}
      <motion.span
        className="font-orbitron text-4xl lg:text-5xl xl:text-6xl font-black text-tekken-gold relative z-[1] -translate-y-1"
        style={{ textShadow: '0 0 20px rgba(218,165,32,0.6)' }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        ?
      </motion.span>

      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-1 z-[2]">
        <span className="font-rajdhani text-[10px] lg:text-xs text-tekken-gold font-semibold uppercase tracking-wider truncate block text-center leading-tight">
          Random
        </span>
      </div>
    </motion.div>
  );
});