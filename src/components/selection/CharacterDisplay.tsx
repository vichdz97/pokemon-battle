import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Pokemon } from '../../types/pokemon';
import { getOfficialArtwork } from '../../services/pokeApi';
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
                src={getOfficialArtwork(pokemon)}
                alt={pokemon.name}
                className={clsx(
                  'relative z-10 h-64 w-64 object-contain drop-shadow-2xl',
                  isPlayer ? '' : 'scale-x-[-1]'
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Character name plate */}
      <div className="w-full py-4 px-6">
        <AnimatePresence mode="wait">
          {pokemon ? (
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
                  'font-orbitron text-3xl font-black uppercase tracking-wider',
                  isPlayer ? 'neon-text-blue' : 'neon-text-red'
                )}
              >
                {pokemon.name}
              </h2>
              
              {/* Types */}
              <div className="flex gap-2 mt-2 justify-center">
                {pokemon.types.map((t) => (
                  <span
                    key={t.type.name}
                    className="px-3 py-1 rounded text-xs font-bold uppercase text-white shadow-lg"
                    style={{ backgroundColor: typeColors[t.type.name] || '#888' }}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={clsx(
                isPlayer ? 'text-left' : 'text-right'
              )}
            >
              <span className="font-orbitron text-xl text-gray-600 uppercase">
                Select Pokémon
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};