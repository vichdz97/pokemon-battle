import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { getPokemonHomeArtwork } from '../../services/pokeApi';
import { typeColors } from '../../utils/typeEffectiveness';

interface CharacterDisplayProps {
  pokemon: Pokemon | null;
  side: 'player' | 'cpu';
}

export function CharacterDisplay({ pokemon, side }: CharacterDisplayProps) {
  const isPlayer = side === 'player';

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center',
      )}
    >
      {/* Character artwork area */}
      <div className="w-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {pokemon && (
            <motion.div
              key={pokemon.id}
              initial={{
                x: isPlayer ? -100 : 100,
                opacity: 0,
                scale: 0.8
              }}
              animate={{
                x: 0,
                opacity: 1,
                scale: 1
              }}
              exit={{
                x: isPlayer ? -100 : 100,
                opacity: 0,
                scale: 0.8
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Glow effect behind sprite */}
              <div
                className="absolute inset-0 blur-3xl opacity-50"
                style={{
                  background: `radial-gradient(circle, ${typeColors[pokemon.types[0]?.type.name] || '#888'}66 0%, transparent 70%)`,
                }}
              />

              {/* Character sprite */}
              <img
                src={getPokemonHomeArtwork(pokemon)}
                alt={pokemon.name}
                className={clsx(
                  'relative z-10 h-32 w-32 md:h-56 md:w-56 object-contain drop-shadow-2xl',
                  isPlayer && 'scale-x-[-1]'
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character name plate */}
      <div className="w-full py-2 md:py-4 px-4 md:px-6">
        <AnimatePresence mode="wait">
          {pokemon && (
            <motion.div
              key={pokemon.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-center"
            >
              {/* Name */}
              <h2
                className={clsx(
                  'font-orbitron text-xl md:text-3xl font-black uppercase tracking-wider',
                  isPlayer ? 'neon-text-blue' : 'neon-text-red'
                )}
              >
                {pokemon.name}
              </h2>

              {/* Types */}
              <div className="flex gap-2 mt-1 md:mt-2 justify-center">
                {pokemon.types.map((t) => (
                  <span
                    key={t.type.name}
                    className="px-2 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase text-white shadow-lg"
                    style={{ backgroundColor: typeColors[t.type.name] || '#888' }}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}