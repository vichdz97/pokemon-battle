import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { BattlePokemon } from '../../types/pokemon';
import { getSprite } from '../../services/pokeApi';
import { HealthBar } from '../common/HealthBar';
import { typeColors } from '../../utils/typeEffectiveness';

interface PokemonSpriteProps {
  pokemon: BattlePokemon;
  isPlayer: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  isFainted?: boolean;
}

export function PokemonSprite({
  pokemon,
  isPlayer,
  isAttacking = false,
  isTakingDamage = false,
  isFainted = false
}: PokemonSpriteProps) {
  const spriteUrl = getSprite(pokemon, isPlayer);

  return (
    <div className={clsx(
      'flex flex-col',
      isPlayer ? 'items-start' : 'items-end'
    )}>
      {/* Player Pokemon - sprite above info box */}
      {isPlayer && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pokemon.id}-${isFainted}`}
            className="relative mb-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isFainted ? 0 : 1,
              opacity: isFainted ? 0 : 1,
              x: isAttacking ? 30 : 0,
              y: isAttacking ? -20 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={spriteUrl}
              alt={pokemon.name}
              className="w-70 h-70 object-contain translate-y-20 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              animate={{
                x: isTakingDamage ? [0, -5, 5, -5, 5, 0] : 0,
                filter: isTakingDamage ? ['brightness(1)', 'brightness(2)', 'brightness(0.5)', 'brightness(1)'] : 'brightness(1)',
              }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pokemon info box */}
      <motion.div
        className={clsx(
          'p-3 rounded-lg backdrop-blur-xl',
          'bg-gradient-to-br from-tekken-panel/80 to-tekken-dark/80',
          'border border-white/10',
          'w-75'
        )}
        initial={{ x: isPlayer ? -50 : 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-orbitron text-base font-bold text-white capitalize">
              {pokemon.name}
            </h3>
            <div className="flex gap-1">
              {pokemon.types.map((t) => (
                <span
                  key={t.type.name}
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: typeColors[t.type.name] || '#888' }}
                >
                  {t.type.name}
                </span>
              ))}
            </div>
          </div>
          <span className="font-orbitron text-sm text-gray-400">
            Lv.{pokemon.level}
          </span>
        </div>

        <HealthBar current={pokemon.currentHp} max={pokemon.maxHp} size="small" />
      </motion.div>

      {/* CPU Pokemon - sprite below info box */}
      {!isPlayer && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pokemon.id}-${isFainted}`}
            className="relative mt-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isFainted ? 0 : 1,
              opacity: isFainted ? 0 : 1,
              x: isAttacking ? -30 : 0,
              y: isAttacking ? 20 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={spriteUrl}
              alt={pokemon.name}
              className="w-50 h-50 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              animate={{
                x: isTakingDamage ? [0, -5, 5, -5, 5, 0] : 0,
                filter: isTakingDamage ? ['brightness(1)', 'brightness(2)', 'brightness(0.5)', 'brightness(1)'] : 'brightness(1)',
              }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}