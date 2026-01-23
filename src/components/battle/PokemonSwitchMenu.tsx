import { motion } from 'framer-motion';
import clsx from 'clsx';
import { BattlePokemon } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';
import { GlassButton } from '../common/GlassButton';
import { HealthBar } from '../common/HealthBar';

interface PokemonSwitchMenuProps {
  team: BattlePokemon[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onBack: () => void;
  disabled?: boolean;
  forcedSwitch?: boolean;
}

export function PokemonSwitchMenu({
  team,
  activeIndex,
  onSwitch,
  onBack,
  disabled = false,
  forcedSwitch = false
}: PokemonSwitchMenuProps) {
  const availableSwitches = team.filter((p, i) => i !== activeIndex && p.currentHp > 0);

  return (
    <motion.div
      className="w-full md:w-96 space-y-3"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-tekken-panel/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 max-h-44 md:max-h-96 overflow-y-auto scrollbar-thin">
        {availableSwitches.length === 0 ? (
          <p className="text-gray-500 text-center font-rajdhani py-6">No Pokémon available to switch</p>
        ) : (
          <div className="space-y-2">
            {team.map((pokemon, index) => {
              const isActive = index === activeIndex;
              const isFainted = pokemon.currentHp <= 0;
              const isDisabled = disabled || isActive || isFainted;
              const mainType = pokemon.types[0]?.type.name || 'normal';
              const typeColor = typeColors[mainType];

              return (
                <motion.button
                  key={`${pokemon.id}-${index}`}
                  className={clsx(
                    'w-full p-2.5 rounded-lg transition-all duration-200',
                    'border-2 flex items-center gap-3',
                    isActive && !isFainted && 'border-tekken-gold/50 bg-tekken-gold/10',
                    isFainted && 'border-gray-600/30 bg-gray-900/30 opacity-50 cursor-not-allowed',
                    !isActive && !isFainted && 'bg-gradient-to-r from-slate-100/5 to-slate-100/2 hover:border-slate-100/40',
                    isDisabled && !isActive && 'cursor-not-allowed'
                  )}
                  style={{
                    borderColor: isActive ? undefined : isFainted ? undefined : `${typeColor}44`,
                  }}
                  onClick={() => !isDisabled && onSwitch(index)}
                  disabled={isDisabled}
                  whileHover={!isDisabled ? { scale: 1.01 } : {}}
                  whileTap={!isDisabled ? { scale: 0.99 } : {}}
                >
                  <div className="relative flex-1 flex flex-col gap-1 items-center justify-center w-10 h-10">
                    {/* Active (IN) Badge */}
                    {isActive && !isFainted && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-tekken-gold rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-black">IN</span>
                      </div>
                    )}
                    {/* Pokemon sprite */}
                    <img
                      src={pokemon.sprites.other.home.front_default || pokemon.sprites.front_default}
                      alt={pokemon.name}
                      className={clsx(
                        'w-full h-full object-contain',
                        isFainted && 'grayscale'
                      )}
                    />
                    {/* Type badges */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {pokemon.types.map((t) => (
                        <span
                            key={t.type.name}
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white"
                            style={{ backgroundColor: typeColors[t.type.name] || '#888' }}
                        >
                            {t.type.name}
                        </span>
                        ))}
                    </div>
                  </div>

                  {/* Pokemon info */}
                  <div className="flex-3 text-left">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-orbitron text-sm font-semibold text-white capitalize truncate">
                        {pokemon.name}
                      </span>
                      <span className="font-rajdhani text-xs text-gray-400">
                        Lv.{pokemon.level}
                      </span>
                    </div>
                    <div className="w-full">
                      <HealthBar current={pokemon.currentHp} max={pokemon.maxHp} size="small" showText={true} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {!forcedSwitch && (
        <GlassButton
          variant="gray"
          className="w-full bg-tekken-panel/60"
          size="small"
          onClick={onBack}
        >
          ← Back
        </GlassButton>
      )}
    </motion.div>
  );
}