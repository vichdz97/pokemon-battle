import { motion } from 'framer-motion';
import clsx from 'clsx';
import { BattleMove } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface MoveSelectorProps {
  moves: BattleMove[];
  onSelectMove: (move: BattleMove) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function MoveSelector({ moves, onSelectMove, onBack, disabled = false }: MoveSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full md:gap-2.5 md:w-96">
      {moves.map((move, index) => {
        const typeColor = typeColors[move.type.name] || '#888';
        const noPP = move.currentPp <= 0;
        const isDisabled = disabled || noPP;

        return (
          <motion.button
            key={move.id || index}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              'relative p-2 md:p-3 rounded-xl border-2 overflow-hidden transition-all duration-300',
              isDisabled && 'opacity-40 cursor-not-allowed'
            )}
            style={{
              background: `linear-gradient(135deg, ${typeColor}44 0%, ${typeColor}22 100%)`,
              borderColor: typeColor,
            }}
            onClick={() => !isDisabled && onSelectMove(move)}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
          >
            {/* Shine overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

            {/* Move name */}
            <div className="font-orbitron text-sm font-semibold text-white capitalize mb-1 md:mb-2 truncate">
              {move.name.split('-').join(' ')}
            </div>

            {/* Move info */}
            <div className="flex justify-between items-center">
              <span
                className="px-1.5 md:px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                style={{ backgroundColor: typeColor }}
              >
                {move.type.name}
              </span>
              <div className="font-rajdhani text-xs text-gray-300">
                <span className={clsx(noPP && 'text-red-400')}>
                  {move.currentPp}/{move.maxPp}
                </span>
              </div>
            </div>

            {/* Power indicator */}
            <div className="mt-0.5 md:mt-1 text-right">
              <span className="font-rajdhani text-[10px] text-gray-400">
                {move.power ? `PWR: ${move.power}` : 'Status'}
              </span>
            </div>
          </motion.button>
        );
      })}

      <motion.button
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={clsx(
          'col-span-2 py-2 md:py-2.5 rounded-xl',
          'bg-gradient-to-b from-white/10 via-white/5 to-white/8',
          'border border-white/20 hover:border-white/30',
          'font-orbitron text-sm text-gray-400 hover:text-white',
          'transition-all duration-300'
        )}
        onClick={onBack}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        ← Back
      </motion.button>
    </div>
  );
}