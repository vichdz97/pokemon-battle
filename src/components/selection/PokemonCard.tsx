import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface PokemonCardProps {
  pokemon: Pokemon;
  isPlayer: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  onHover: (pokemon: Pokemon | null) => void;
}

export function PokemonCard({
  pokemon,
  isPlayer,
  isSelected,
  isDisabled,
  onSelect,
  onHover
}: PokemonCardProps) {
  const mainType = pokemon.types[0]?.type.name || 'normal';
  const typeColor = typeColors[mainType];

  return (
    <motion.button
      className={clsx(
        'relative flex items-center justify-center p-1.5 md:p-2 rounded-lg border-2 transition-all duration-200 overflow-hidden',
        'bg-gradient-to-br from-tekken-panel to-tekken-dark',
        isSelected && 'ring-2 ring-primary-blue border-primary-blue',
        isDisabled && 'opacity-40 cursor-not-allowed',
        !isDisabled && !isSelected && 'hover:border-white/30'
      )}
      style={{
        borderColor: isSelected ? undefined : `${typeColor}66`,
      }}
      onClick={onSelect}
      onMouseEnter={() => onHover(pokemon)}
      onMouseLeave={() => onHover(null)}
      onTouchStart={() => onHover(pokemon)}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
    >
      {/* Pokemon sprite */}
      <img
        src={pokemon.sprites.other.home.front_default}
        alt={pokemon.name}
        className={clsx(
          'w-12 h-12 md:w-16 md:h-16 object-contain scale-y-[2]',
          isPlayer ? 'scale-x-[-2]' : 'scale-x-[2]',
        )}
      />

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `radial-gradient(circle, ${typeColor}22 0%, transparent 70%)`,
          }}
        />
      )}
    </motion.button>
  );
}