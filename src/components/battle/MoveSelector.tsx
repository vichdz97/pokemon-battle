import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [infoMode, setInfoMode] = useState(false);
  const [selectedMoveForInfo, setSelectedMoveForInfo] = useState<BattleMove | null>(null);

  // Handle keyboard shortcut (Y key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'y' && !disabled) {
        if (selectedMoveForInfo) {
          // If viewing move details, go back to move list in info mode
          setSelectedMoveForInfo(null);
        } else {
          // Toggle info mode
          setInfoMode(prev => !prev);
        }
      }
      if (e.key === 'Escape') {
        if (selectedMoveForInfo) {
          setSelectedMoveForInfo(null);
        } else if (infoMode) {
          setInfoMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, infoMode, selectedMoveForInfo]);

  const handleMoveClick = (move: BattleMove) => {
    if (disabled) return;
    
    if (infoMode) {
      setSelectedMoveForInfo(move);
    } else {
      if (move.currentPp > 0) {
        onSelectMove(move);
      }
    }
  };

  const handleBackClick = () => {
    if (selectedMoveForInfo) {
      setSelectedMoveForInfo(null);
    } else if (infoMode) {
      setInfoMode(false);
    } else {
      onBack();
    }
  };

  const getDamageClassIcon = (damageClass: string) => {
    switch (damageClass) {
      case 'physical':
        return '💥';
      case 'special':
        return '✨';
      case 'status':
        return '◐';
      default:
        return '•';
    }
  };

  const getDamageClassColor = (damageClass: string) => {
    switch (damageClass) {
      case 'physical':
        return 'text-orange-400';
      case 'special':
        return 'text-blue-400';
      case 'status':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full md:w-96 space-y-3"
    >
      {/* Move Info Toggle Button */}
      <div className="flex gap-2">
        <GlassButton
          variant={infoMode ? 'yellow' : 'gray'}
          size="small"
          className={clsx(
            'flex-1 flex items-center justify-center gap-2',
            infoMode && 'bg-yellow-500/20'
          )}
          onClick={() => {
            setInfoMode(!infoMode);
            setSelectedMoveForInfo(null);
          }}
          disabled={disabled}
        >
          <span>ℹ️</span>
          <span>Move Info</span>
          <span className="text-xs opacity-60">(Y)</span>
        </GlassButton>
      </div>

      {/* Info Mode Indicator */}
      <AnimatePresence>
        {infoMode && !selectedMoveForInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2"
          >
            <p className="text-yellow-400 text-xs font-rajdhani text-center">
              📖 Info Mode Active — Select a move to view details
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Move Detail View */}
      <AnimatePresence mode="wait">
        {selectedMoveForInfo ? (
          <motion.div
            key="move-detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-tekken-panel/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden"
          >
            {/* Move Header */}
            <div
              className="p-4 border-b border-white/10"
              style={{
                background: `linear-gradient(135deg, ${typeColors[selectedMoveForInfo.type.name]}44 0%, ${typeColors[selectedMoveForInfo.type.name]}22 100%)`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-orbitron text-lg font-bold text-white capitalize">
                  {selectedMoveForInfo.name.split('-').join(' ')}
                </h3>
                <span
                  className="px-2 py-1 rounded text-xs font-bold uppercase text-white"
                  style={{ backgroundColor: typeColors[selectedMoveForInfo.type.name] }}
                >
                  {selectedMoveForInfo.type.name}
                </span>
              </div>
              
              {/* Damage Class */}
              <div className={clsx('flex items-center gap-1 text-sm', getDamageClassColor(selectedMoveForInfo.damage_class.name))}>
                <span>{getDamageClassIcon(selectedMoveForInfo.damage_class.name)}</span>
                <span className="capitalize font-rajdhani font-semibold">
                  {selectedMoveForInfo.damage_class.name}
                </span>
              </div>
            </div>

            {/* Move Stats */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* Power */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 font-rajdhani uppercase mb-1">Power</div>
                  <div className="font-orbitron text-lg font-bold text-slate-100">
                    {selectedMoveForInfo.power || '—'}
                  </div>
                </div>
                
                {/* Accuracy */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 font-rajdhani uppercase mb-1">Accuracy</div>
                  <div className="font-orbitron text-lg font-bold text-slate-100">
                    {selectedMoveForInfo.accuracy ? `${selectedMoveForInfo.accuracy}%` : '—'}
                  </div>
                </div>
                
                {/* PP */}
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-400 font-rajdhani uppercase mb-1">PP</div>
                  <div className="font-orbitron text-lg font-bold text-slate-100">
                    {selectedMoveForInfo.currentPp}/{selectedMoveForInfo.maxPp}
                  </div>
                </div>
              </div>

              {/* Priority */}
              {selectedMoveForInfo.priority !== 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-rajdhani uppercase">Priority</span>
                    <span className={clsx(
                      'font-orbitron text-sm font-bold',
                      selectedMoveForInfo.priority > 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {selectedMoveForInfo.priority > 0 ? '+' : ''}{selectedMoveForInfo.priority}
                    </span>
                  </div>
                </div>
              )}

              {/* Effect Description */}
              {selectedMoveForInfo.effect_entries && selectedMoveForInfo.effect_entries.length > 0 && (
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-xs text-gray-400 font-rajdhani uppercase mb-2">Effect</div>
                  <p className="text-sm text-gray-200 font-rajdhani leading-relaxed">
                    {selectedMoveForInfo.effect_entries[1]?.short_effect || 
                     selectedMoveForInfo.effect_entries[1]?.effect || 
                     'No description available.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Move List */
          <motion.div
            key="move-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-h-44 md:max-h-96 p-1 space-y-2 overflow-y-auto scrollbar-thin"
          >
            {moves.map((move, index) => {
              const typeColor = typeColors[move.type.name] || '#000';
              const noPP = move.currentPp <= 0;
              const isDisabled = disabled || (noPP && !infoMode);

              return (
                <motion.button
                  key={move.id || index}
                  className={clsx(
                    'relative w-full flex items-center gap-4 p-3 rounded-xl backdrop-blur-md border-2 overflow-hidden transition-all duration-300',
                    isDisabled && !infoMode && 'opacity-40 cursor-not-allowed',
                    infoMode && 'ring-2 ring-yellow-500/30 hover:ring-yellow-500/60',
                    !isDisabled && 'hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${typeColor}22 0%, ${typeColor} 100%)`,
                    borderColor: typeColor,
                  }}
                  onClick={() => handleMoveClick(move)}
                  disabled={isDisabled && !infoMode}
                >
                  {/* Shine overlay */}
                  <div className="-z-1 absolute inset-0 bg-gradient-to-b from-slate-100/20 to-tekken-dark/30 pointer-events-none" />

                  {/* Info mode indicator */}
                  {infoMode && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500/80 rounded-full flex items-center justify-center">
                      <span className="text-[10px]">ℹ️</span>
                    </div>
                  )}

                  {/* Move Type */}
                  <span className="w-1/4 px-1.5 md:px-2 py-0.5 rounded font-bold text-[10px] uppercase" style={{ backgroundColor: typeColor }}>
                    {move.type.name}
                  </span>

                  {/* Move Name */}
                  <span className="flex-1 font-orbitron font-semibold text-sm text-left capitalize">
                    {move.name.split('-').join(' ')}
                  </span>

                  {/* Damage Class Icon */}
                  <span className={clsx('text-sm', getDamageClassColor(move.damage_class.name))}>
                    {getDamageClassIcon(move.damage_class.name)}
                  </span>

                  {/* Move PP */}
                  <span className={clsx(noPP && 'text-red-400')}>{move.currentPp}/{move.maxPp}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back Button */}
      <GlassButton 
        variant="gray" 
        size="small" 
        className="w-full bg-tekken-dark/60" 
        onClick={handleBackClick}
      >
        ← {selectedMoveForInfo ? 'Back to Moves' : infoMode ? 'Exit Info Mode' : 'Back'}
      </GlassButton>
    </motion.div>
  );
}