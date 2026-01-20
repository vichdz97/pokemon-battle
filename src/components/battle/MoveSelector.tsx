import { motion } from 'framer-motion';
import clsx from 'clsx';
import { BattleMove } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';

interface MoveSelectorProps {
  moves: BattleMove[];
  onSelectMove: (move: BattleMove, index: number) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function MoveSelector({ moves, onSelectMove, onBack, disabled = false }: MoveSelectorProps) {
  const formatMoveName = (name: string) => name.split('-').join(' ');

  return (
    <div className="grid grid-cols-2 gap-2.5 w-96">
      {moves.map((move, index) => {
        const typeColor = typeColors[move.type.name] || '#888';
        const noPP = move.currentPp <= 0;
        const isDisabled = disabled || noPP;

        return (
          <motion.button
            key={move.id || index}
            className={clsx(
              'relative p-3 rounded-xl border-2 overflow-hidden',
              'transition-all duration-300',
              isDisabled && 'opacity-40 cursor-not-allowed'
            )}
            style={{
              background: `linear-gradient(135deg, ${typeColor}44 0%, ${typeColor}22 100%)`,
              borderColor: typeColor,
            }}
            onClick={() => !isDisabled && onSelectMove(move, index)}
            disabled={isDisabled}
            whileHover={!isDisabled ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
          >
            {/* Shine overlay */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            
            {/* Move name */}
            <div className="font-orbitron text-sm font-semibold text-white capitalize mb-2">
              {formatMoveName(move.name)}
            </div>
            
            {/* Move info */}
            <div className="flex justify-between items-center">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white"
                style={{ backgroundColor: typeColor }}
              >
                {move.type.name}
              </span>
              <div className="font-rajdhani text-xs text-gray-300">
                <span className={clsx(noPP && 'text-red-400')}>
                  PP: {move.currentPp}/{move.maxPp}
                </span>
              </div>
            </div>
            
            {/* Power indicator */}
            <div className="mt-1 text-right">
              <span className="font-rajdhani text-[10px] text-gray-400">
                {move.power ? `PWR: ${move.power}` : 'Status'}
              </span>
            </div>
          </motion.button>
        );
      })}
      
      {/* Back button */}
      <motion.button
        className={clsx(
          'col-span-2 py-2.5 rounded-xl',
          'bg-gradient-to-b from-white/10 via-white/5 to-white/8',
          'border border-white/20',
          'font-orbitron text-sm text-gray-400',
          'hover:text-white hover:border-white/30',
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
};