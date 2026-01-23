import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface TeamRosterProps {
  team: Pokemon[];
  maxSize: number;
  side: 'player' | 'cpu';
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function TeamRoster({ team, maxSize, side, onRemove }: TeamRosterProps) {
  const isPlayer = side === 'player';
  const emptySlots = maxSize - team.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className={clsx(
          'font-orbitron text-[10px] md:text-xs uppercase tracking-wider',
          isPlayer ? 'text-primary-blue' : 'text-primary-red'
        )}>
          Team ({team.length}/{maxSize})
        </h3>
      </div>

      <div className="flex gap-1.5 md:gap-2">
        <AnimatePresence mode="popLayout">
          {team.map((pokemon, index) => {
            const mainType = pokemon.types[0]?.type.name || 'normal';
            const typeColor = typeColors[mainType];

            return (
              <motion.div
                key={`${pokemon.id}-${index}`}
                className="relative group"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                layout
              >
                {/* Order number */}
                <div className={clsx(
                  'absolute -top-2 left-1/2 -translate-x-1/2 z-10',
                  'w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center',
                  'font-orbitron text-[8px] md:text-[10px] font-bold text-white',
                  isPlayer ? 'bg-primary-blue' : 'bg-primary-red'
                )}>
                  {index + 1}
                </div>

                {/* Pokemon slot */}
                <div
                  className={clsx(
                    'w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 overflow-hidden',
                    'flex items-center justify-center',
                    'bg-gradient-to-br from-tekken-panel to-tekken-dark',
                    'cursor-pointer transition-all duration-200'
                  )}
                  style={{ borderColor: `${typeColor}88` }}
                >
                  <img
                    src={pokemon.sprites.other.home.front_default || pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className={clsx(
                        "w-8 h-8 md:w-10 md:h-10 object-contain",
                        isPlayer && "scale-x-[-1]"
                    )}
                  />
                </div>

                {/* Remove button */}
                <motion.button
                  className={clsx(
                    'absolute -top-1 -right-1 z-20',
                    'w-4 h-4 md:w-5 md:h-5 rounded-full',
                    'bg-red-500 hover:bg-red-400',
                    'flex items-center justify-center',
                    'text-white text-[8px] md:text-[10px] font-bold',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'md:opacity-0 md:group-hover:opacity-100'
                  )}
                  onClick={() => onRemove(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className={clsx(
              'w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 border-dashed',
              'border-white/20 flex items-center justify-center mt-2'
            )}
          >
            <span className="text-white/20 text-xs">+</span>
          </div>
        ))}
      </div>
    </div>
  );
}