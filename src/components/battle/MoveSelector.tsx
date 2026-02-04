import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [hoveredMove, setHoveredMove] = useState<BattleMove | null>(null);
  const [infoMode, setInfoMode] = useState(false);
  const [selectedMoveForInfo, setSelectedMoveForInfo] = useState<BattleMove | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMoveClick = (move: BattleMove) => {
    if (disabled) return;
    
    // show info modal
    if (isMobile && infoMode) {
      setSelectedMoveForInfo(move);
      return;
    }

    if (move.currentPp > 0) {
      onSelectMove(move);
    }
  };

  const handleMoveHover = (move: BattleMove | null) => {
    if (!isMobile) {
      setHoveredMove(move);
    }
  };

  const handleUseMoveFromInfo = () => {
    if (selectedMoveForInfo && selectedMoveForInfo.currentPp > 0) {
      onSelectMove(selectedMoveForInfo);
      setSelectedMoveForInfo(null);
      setInfoMode(false);
    }
  };

  // Mobile modal rendered via Portal to escape container constraints
  const mobileInfoModal = isMobile && selectedMoveForInfo ? createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className='fixed inset-0 z-[100] flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm'
        onClick={() => setSelectedMoveForInfo(null)}
      >
        <motion.div
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          transition={{ duration: 0.2 }}
          className='w-full max-w-sm mt-20'
          onClick={(e) => e.stopPropagation()}
        >
          <MoveInfoPanel 
            move={selectedMoveForInfo} 
            showUseButton={selectedMoveForInfo.currentPp > 0}
            onUseMove={handleUseMoveFromInfo}
            onClose={() => setSelectedMoveForInfo(null)}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      {/* Desktop: Wrapper with relative positioning for hover panel */}
      <div className='relative flex items-start'>
        {/* Desktop Hover Info Panel - Appears to the left */}
        <AnimatePresence>
          {!isMobile && hoveredMove && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className='hidden md:block absolute w-full -translate-x-full pr-3'
            >
              <MoveInfoPanel move={hoveredMove} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Move Selector */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className='w-full md:w-96 flex flex-col gap-2'
        >
          <div className='md:hidden'>
            <GlassButton
              variant={infoMode ? 'yellow' : 'gray'}
              size='small'
              className={clsx(
                'w-full',
                infoMode && 'bg-yellow-500/20'
              )}
              onClick={() => {
                setInfoMode(!infoMode);
                setSelectedMoveForInfo(null);
              }}
              disabled={disabled}
            >
              <span>{infoMode ? 'Info ON' : 'Move Info'}</span>
              { infoMode && 
                <>
                  <br /> 
                  <p className='text-yellow-400 text-xs font-rajdhani text-center'>Tap a move to view details</p>
                </>
              }
            </GlassButton>
          </div>

          {/* Move List */}
          <div className='grid grid-cols-2 grid-rows-2 gap-1 md:flex md:flex-col md:gap-2 md:p-1 max-h-32 md:max-h-80 overflow-y-auto scrollbar-thin'>
            {moves.map((move, index) => {
              const typeColor = typeColors[move.type.name] || '#000';
              const noPP = move.currentPp <= 0;
              const isDisabled = disabled || (noPP && !infoMode);
              const isHovered = hoveredMove?.id === move.id;

              return (
                <motion.button
                  key={move.id || index}
                  className={clsx(
                    'relative grid grid-cols-2 grid-rows-2 gap-0.5 p-2 h-full md:flex md:items-center md:gap-4 md:p-3 rounded-xl backdrop-blur-md border-2 overflow-hidden transition-all duration-300',
                    isDisabled && !infoMode && 'opacity-40 cursor-not-allowed',
                    isMobile && infoMode && 'ring-2 ring-yellow-500/30',
                    !isMobile && isHovered && 'ring-2 ring-slate-100/40 scale-[1.02]',
                    !isDisabled && 'hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${typeColor}22 0%, ${typeColor} 100%)`,
                    borderColor: typeColor,
                  }}
                  onClick={() => handleMoveClick(move)}
                  onMouseEnter={() => handleMoveHover(move)}
                  onMouseLeave={() => handleMoveHover(null)}
                  disabled={isDisabled && !infoMode}
                >
                  {/* Shine overlay */}
                  <div className='-z-1 absolute inset-0 bg-gradient-to-b from-slate-100/20 to-tekken-dark/30 pointer-events-none' />

                  {/* Move Type */}
                  <span 
                    className='row-start-2 col-start-1 md:w-1/4 px-2 py-0.5 rounded font-bold text-[10px] uppercase text-slate-100' 
                    style={{ backgroundColor: typeColor }}
                  >
                    {move.type.name}
                  </span>

                  {/* Move Name */}
                  <span className='row-start-1 col-span-2 md:flex-1 font-orbitron font-semibold text-sm text-left capitalize truncate'>
                    {move.name.split('-').join(' ')}
                  </span>

                  {/* Move PP */}
                  <span className={clsx('row-start-2 col-start-2 font-orbitron text-xs text-right', noPP && 'text-red-400')}>
                    {move.currentPp}/{move.maxPp}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className='w-full'>
            <GlassButton 
              variant='gray' 
              size='small' 
              className='w-full bg-tekken-dark/60' 
              onClick={onBack}
            >
              ← Back
            </GlassButton>
          </div>
        </motion.div>
      </div>

      {/* Mobile Info Modal - Rendered via Portal */}
      {mobileInfoModal}
    </>
  );
}

// ============ Move Info Panel Component ============

interface MoveInfoPanelProps {
  move: BattleMove;
  showUseButton?: boolean;
  onUseMove?: () => void;
  onClose?: () => void;
}

function MoveInfoPanel({ move, showUseButton = false, onUseMove, onClose }: MoveInfoPanelProps) {
  const typeColor = typeColors[move.type.name] || '#888';

  const getDamageClassIcon = (damageClass: string) => {
    switch (damageClass) {
      case 'physical':
        return 'physical-move.png';
      case 'special':
        return 'special-move.png';
      case 'status':
        return 'status-move.png';
      default:
        return '';
    }
  };

  return (
    <div className='bg-tekken-panel/95 backdrop-blur-xl border border-slate-100/20 rounded-lg overflow-hidden shadow-2xl'>
      {/* Move Header */}
      <div
        className='p-3 border-b border-slate-100/10'
        style={{
          background: `linear-gradient(135deg, ${typeColor}44 0%, ${typeColor}22 100%)`,
        }}
      >
        <div className='flex items-center justify-between mb-1.5'>
          <h3 className='font-orbitron text-lg md:text-xl font-bold text-slate-100 capitalize'>
            {move.name.split('-').join(' ')}
          </h3>
          <div className='flex items-center justify-center gap-2'>
            <img 
              src={`src/assets/images/${getDamageClassIcon(move.damage_class.name)}`} 
              alt={`${move.damage_class.name} icon`} 
              className='w-10'
            />
            <span
              className='px-2 py-0.5 rounded text-xs font-bold uppercase text-slate-100'
              style={{ backgroundColor: typeColor }}
            >
              {move.type.name}
            </span>
          </div>
        </div>
      </div>

      {/* Move Stats */}
      <div className='p-3 space-y-2.5'>
        <div className='grid grid-cols-3 gap-2'>
          {/* Power */}
          <div className='bg-slate-950/30 rounded-lg p-2 text-center'>
            <div className='text-sm text-gray-400 font-rajdhani uppercase mb-0.5'>Power</div>
            <div className='font-orbitron font-bold text-slate-100'>
              {move.power || '—'}
            </div>
          </div>
          
          {/* Accuracy */}
          <div className='bg-slate-950/30 rounded-lg p-2 text-center'>
            <div className='text-sm text-gray-400 font-rajdhani uppercase mb-0.5'>Accuracy</div>
            <div className='font-orbitron font-bold text-slate-100'>
              {move.accuracy ? `${move.accuracy}%` : '—'}
            </div>
          </div>
          
          {/* PP */}
          <div className='bg-slate-950/30 rounded-lg p-2 text-center'>
            <div className='text-sm text-gray-400 font-rajdhani uppercase mb-0.5'>PP</div>
            <div className={clsx(
              'font-orbitron font-bold',
              move.currentPp <= 0 ? 'text-red-400' : 'text-slate-100'
            )}>
              {move.currentPp}/{move.maxPp}
            </div>
          </div>
        </div>

        {/* Priority */}
        {move.priority !== 0 && (
          <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-2'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400 font-rajdhani uppercase'>Priority</span>
              <span className={clsx(
                'font-orbitron text-xs font-bold',
                move.priority > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {move.priority > 0 ? '+' : ''}{move.priority}
              </span>
            </div>
          </div>
        )}

        {/* Effect Description */}
        {move.effect_entries && move.effect_entries.length > 0 && (
          <div className='bg-slate-950/20 rounded-lg p-2.5'>
            <div className='text-sm text-gray-400 font-rajdhani uppercase mb-1'>Effect</div>
            <p className='text-sm text-gray-200 font-rajdhani leading-relaxed'>
              {move.effect_entries[1]?.short_effect || 
               move.effect_entries[0]?.short_effect ||
               'No description available.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(showUseButton || onClose) && (
          <div className='flex gap-2 pt-1'>
            {showUseButton && onUseMove && (
              <GlassButton
                variant='blue'
                size='small'
                className='flex-1'
                onClick={onUseMove}
              >
                Use Move
              </GlassButton>
            )}
            {onClose && (
              <GlassButton
                variant='gray'
                size='small'
                className={showUseButton ? 'flex-1' : 'w-full'}
                onClick={onClose}
              >
                Close
              </GlassButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}