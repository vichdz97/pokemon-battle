import { memo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface GridCardProps {
  pokemon: Pokemon;
  playerOrder: number | null;
  cpuOrder: number | null;
  onHover: (pokemon: Pokemon | null) => void;
  onClick: (pokemon: Pokemon) => void;
}

export const GridCard = memo(function GridCard({
  pokemon,
  playerOrder,
  cpuOrder,
  onHover,
  onClick,
}: GridCardProps) {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = typeColors[mainType];
  const isSelectedByPlayer = playerOrder !== null;
  const isSelectedByCpu = cpuOrder !== null;
  const isSelectedByBoth = isSelectedByPlayer && isSelectedByCpu;

  return (
    <motion.div
      data-pokemon-id={pokemon.id}
      // aspect-square lets the card grow with column width instead of being
      // pinned to a fixed sprite size. Fewer columns → bigger readable cards.
      className={clsx(
        'relative aspect-square flex items-center justify-center rounded-lg border-2 transition-all duration-150 overflow-hidden cursor-pointer',
        'bg-gradient-to-br from-tekken-panel to-tekken-dark',
        'hover:brightness-125',
        isSelectedByBoth && 'ring-2 ring-purple-400',
        !isSelectedByBoth && isSelectedByPlayer && 'ring-2 ring-primary-blue border-primary-blue',
        !isSelectedByBoth && isSelectedByCpu && 'ring-2 ring-primary-red border-primary-red',
        !isSelectedByPlayer && !isSelectedByCpu && 'hover:border-white/40'
      )}
      style={{
        borderColor: isSelectedByPlayer || isSelectedByCpu ? undefined : `${typeColor}55`,
      }}
      onMouseEnter={() => onHover(pokemon)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(pokemon)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: typeColor }} />

      {isSelectedByPlayer && (
        <motion.div
          className="absolute top-1 left-1 z-10 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary-blue flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <span className="text-[10px] lg:text-[11px] font-orbitron font-bold text-white">{playerOrder}</span>
        </motion.div>
      )}

      {isSelectedByCpu && (
        <motion.div
          className="absolute top-1 right-1 z-10 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-primary-red flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <span className="text-[10px] lg:text-[11px] font-orbitron font-bold text-white">{cpuOrder}</span>
        </motion.div>
      )}

      {/* Sprite fills ~85% of the card so it scales up with card size */}
      <img
        src={pokemon.sprites.other.home.front_default || pokemon.sprites.front_default}
        alt={pokemon.name}
        className="w-[85%] h-[85%] object-contain relative z-[1] pointer-events-none -translate-y-1"
        draggable={false}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-1 z-[2]">
        <span className="font-rajdhani text-[10px] lg:text-xs text-gray-200 capitalize truncate block text-center leading-tight">
          {pokemon.name}
        </span>
      </div>

      {(isSelectedByPlayer || isSelectedByCpu) && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none z-[1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: isSelectedByBoth
              ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(239,68,68,0.15) 100%)'
              : isSelectedByPlayer
              ? 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.div>
  );
});