import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { BattlePokemon } from '../../types/pokemon';
import { getSprite } from '../../services/pokeApi';
import { HealthBar } from '../common/HealthBar';
import { typeColors } from '../../utils/typeEffectiveness';
import { Pokeball } from '../common/Pokeball';
import {
  getStatusAbbreviation,
  getStatusColor,
  getVolatileAbbreviation,
  getVolatileColor,
} from '../../utils/battleCalculations';
import { StatChangeAnimation } from './BattleAnimations';
import { MoveAnimationState, StatAnimationState } from '../../hooks/useBattle';

interface PokemonSpriteProps {
  pokemon: BattlePokemon;
  isPlayer: boolean;
  isAttacking?: boolean;
  isTakingDamage?: boolean;
  isFainted?: boolean;
  team?: BattlePokemon[];
  activeIndex?: number;
  moveAnimation?: MoveAnimationState;
  statAnimation?: StatAnimationState;
}

export function PokemonSprite({
  pokemon,
  isPlayer,
  isAttacking = false,
  isTakingDamage = false,
  isFainted = false,
  team = [],
  moveAnimation,
  statAnimation,
}: PokemonSpriteProps) {
  const spriteUrl = getSprite(pokemon, isPlayer);
  const statusAbbr = getStatusAbbreviation(pokemon.status);
  const statusColor = getStatusColor(pokemon.status);

  // Collect displayable volatile condition badges (confusion, but not flinch)
  const volatileBadges = pokemon.volatileConditions
    .map(c => ({ abbr: getVolatileAbbreviation(c), color: getVolatileColor(c), condition: c }))
    .filter(b => b.abbr !== '');

  // ── Physical lunge: when a physical move is being used by THIS side ──────
  // The sprite actually lunges to the opponent and returns.
  const isPhysicalLunge =
    !!(moveAnimation?.visible &&
       moveAnimation.kind === 'physical' &&
       moveAnimation.isPlayer === isPlayer);

  // Player lunges: right (+) and up (-)   CPU lunges: left (-) and down (+)
  const lungeX = isPlayer ?  440 : -360;
  const lungeY = isPlayer ? -140 :  110;

  // ── Stat change overlay on this sprite ───────────────────────────────────
  const showStatAnim =
    !!(statAnimation?.visible && statAnimation.isPlayer === isPlayer);

  return (
    <div
      className={clsx(
        'flex flex-col',
        isPlayer ? 'items-start mb-6 md:-mb-20' : 'items-end',
      )}
    >
      {/* ── Player sprite (above info box) ─────────────────────────────── */}
      {isPlayer && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pokemon.id}-${isFainted}`}
            className="relative"
            style={{ overflow: 'visible' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale:   isFainted ? 0 : 1,
              opacity: isFainted ? 0 : 1,
              // Physical lunge overrides the subtle special-move nudge
              x: isPhysicalLunge
                ? [0, lungeX, lungeX, 0]
                : (isAttacking ? 30 : 0),
              y: isPhysicalLunge
                ? [0, lungeY, lungeY, 0]
                : (isAttacking ? -10 : 0),
            }}
            transition={{
              duration: isPhysicalLunge ? 0.7 : 0.3,
              times:    isPhysicalLunge ? [0, 0.38, 0.62, 1] : undefined,
              ease:     isPhysicalLunge ? 'easeInOut' : 'easeOut',
            }}
          >
            <motion.img
              src={spriteUrl}
              alt={pokemon.name}
              className="w-70 h-70 object-contain translate-y-20 md:translate-x-30 md:-translate-y-5 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              animate={{
                x: isTakingDamage ? [0, -5, 5, -5, 5, 0] : 0,
                filter: isTakingDamage
                  ? ['brightness(1)', 'brightness(2)', 'brightness(0.5)', 'brightness(1)']
                  : 'brightness(1)',
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Stat-change overlay rendered AFTER the img so it sits on top */}
            <StatChangeAnimation
              isIncrease={statAnimation?.isIncrease ?? true}
              visible={showStatAnim}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pokemon info box */}
      <motion.div
        className={clsx(
          'z-10 w-80 flex gap-1.5',
          isPlayer ? 'flex-col' : 'flex-col-reverse',
        )}
        initial={{ x: isPlayer ? -50 : 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-1 p-3 border border-white/10 rounded-lg backdrop-blur-xl bg-gradient-to-br from-tekken-panel/50 to-tekken-dark/50">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h3 className="font-orbitron text-base font-bold text-white capitalize">
                {pokemon.name}
              </h3>
              <div className="flex gap-1">
                {pokemon.types.map(t => (
                  <span
                    key={t.type.name}
                    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                    style={{ backgroundColor: typeColors[t.type.name] || '#888' }}
                  >
                    {t.type.name}
                  </span>
                ))}
              </div>
              {/* Status condition badge */}
              {statusAbbr && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: statusColor }}
                >
                  {statusAbbr}
                </span>
              )}
              {/* Volatile condition badges (confusion, etc.) */}
              {volatileBadges.map(({ abbr, color, condition }) => (
                <span
                  key={condition}
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: color }}
                >
                  {abbr}
                </span>
              ))}
            </div>
            <span className="font-orbitron text-sm text-gray-400">
              Lv.{pokemon.level}
            </span>
          </div>
          <HealthBar current={pokemon.currentHp} max={pokemon.maxHp} showText={isPlayer} size="small" />
        </div>

        {team.length > 1 && (
          <div
            className={clsx(
              'relative flex gap-7.5',
              isPlayer ? 'justify-start' : 'justify-end mr-6 mb-6',
            )}
          >
            {team.map((pokemon, index) => (
              <div key={`${pokemon.id}-${index}`}>
                <Pokeball size="tiny" fainted={pokemon.currentHp <= 0} />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── CPU sprite (below info box) ─────────────────────────────────── */}
      {!isPlayer && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pokemon.id}-${isFainted}`}
            className="relative"
            style={{ overflow: 'visible' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale:   isFainted ? 0 : 1,
              opacity: isFainted ? 0 : 1,
              x: isPhysicalLunge
                ? [0, lungeX, lungeX, 0]
                : (isAttacking ? -30 : 0),
              y: isPhysicalLunge
                ? [0, lungeY, lungeY, 0]
                : (isAttacking ? 10 : 0),
            }}
            transition={{
              duration: isPhysicalLunge ? 0.7 : 0.3,
              times:    isPhysicalLunge ? [0, 0.38, 0.62, 1] : undefined,
              ease:     isPhysicalLunge ? 'easeInOut' : 'easeOut',
            }}
          >
            <motion.img
              src={spriteUrl}
              alt={pokemon.name}
              className="w-50 h-50 object-contain md:-translate-x-45 md:translate-y-44"
              animate={{
                x: isTakingDamage ? [0, -5, 5, -5, 5, 0] : 0,
                filter: isTakingDamage
                  ? ['brightness(1)', 'brightness(2)', 'brightness(0.5)', 'brightness(1)']
                  : 'brightness(1)',
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Stat-change overlay rendered AFTER the img */}
            <StatChangeAnimation
              isIncrease={statAnimation?.isIncrease ?? true}
              visible={showStatAnim}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}