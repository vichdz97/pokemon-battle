import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface PokemonCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
  onHover: (pokemon: Pokemon | null) => void;
}

export function PokemonCard({ 
  pokemon, 
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
        'relative p-2 rounded-lg border-2 transition-all duration-200',
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
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
    >
      {/* Pokemon sprite */}
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        className="w-16 h-16 object-contain mx-auto"
      />
      
      {/* Pokemon name */}
      <p className="font-rajdhani text-xs text-white capitalize truncate mt-1">
        {pokemon.name}
      </p>
      
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