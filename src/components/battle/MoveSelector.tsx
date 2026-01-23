import { motion } from 'framer-motion';
import clsx from 'clsx';
import { BattleMove } from '../../types/pokemon';
import { typeColors } from '../../utils/typeEffectiveness';
import { GlassButton } from '../common/GlassButton';

interface MoveSelectorProps {
  moves: BattleMove[];
  onSelectMove: (move: BattleMove) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function MoveSelector({ moves, onSelectMove, onBack, disabled = false }: MoveSelectorProps) {
  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full md:w-96 space-y-3"
    >
      <div className="max-h-44 md:max-h-96 p-1 space-y-2 overflow-y-auto scrollbar-thin">
        {moves.map((move, index) => {
          const typeColor = typeColors[move.type.name] || '#000';
          const noPP = move.currentPp <= 0;
          const isDisabled = disabled || noPP;

          return (
            <motion.button
              key={move.id || index}
              className={clsx(
                'relative w-full flex items-center gap-4 p-3 rounded-xl backdrop-blur-md border-2 overflow-hidden transition-all duration-300',
                isDisabled && 'opacity-40 cursor-not-allowed',
                !isDisabled && 'hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]'
              )}
              style={{
                background: `linear-gradient(135deg, ${typeColor}22 0%, ${typeColor} 100%)`,
                borderColor: typeColor,
              }}
              onClick={() => !isDisabled && onSelectMove(move)}
              disabled={isDisabled}
            >
              {/* Shine overlay */}
              <div className="-z-1 absolute inset-0 bg-gradient-to-b from-slate-100/20 to-tekken-dark/30 pointer-events-none" />

              {/* Move Type */}
              <span className="w-1/4 px-1.5 md:px-2 py-0.5 rounded font-bold text-[10px] uppercase" style={{ backgroundColor: typeColor }}>
                {move.type.name}
              </span>

              {/* Move Name */}
              <span className="flex-1 font-orbitron font-semibold text-sm text-left capitalize">{move.name.split('-').join(' ')}</span>

              {/* Move PP */}
              <span className={clsx(noPP && 'text-red-400')}>{move.currentPp}/{move.maxPp}</span>
            </motion.button>
          );
        })}

      </div>
      <GlassButton variant="gray" size="small" className="w-full bg-tekken-dark/60" onClick={onBack}>
        ← Back
      </GlassButton>
    </motion.div>
  );
}