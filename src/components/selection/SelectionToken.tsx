import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import clsx from 'clsx';

interface SelectionTokenProps {
  side: 'player' | 'cpu';
  label: string;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onDropOnCard: (pokemonId: number) => void;
  teamCount: number;
  maxTeam: number;
}

export function SelectionToken({ side, label, gridRef, onDropOnCard, teamCount, maxTeam }: SelectionTokenProps) {
  const isPlayer = side === 'player';
  const [isDragging, setIsDragging] = useState(false);

  // Motion values let x/y translation compose with the animated `scale`
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const dragStart = useRef({ clientX: 0, clientY: 0, tokenX: 0, tokenY: 0 });

  const findCardUnderPoint = useCallback((clientX: number, clientY: number): number | null => {
    if (!gridRef.current) return null;
    const cards = gridRef.current.querySelectorAll('[data-pokemon-id]');
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const id = card.getAttribute('data-pokemon-id');
        return id !== null ? parseInt(id, 10) : null;
      }
    }
    return null;
  }, [gridRef]);

  const clearHighlights = useCallback(() => {
    gridRef.current
      ?.querySelectorAll('[data-pokemon-id]')
      .forEach(c => c.classList.remove('ring-4', 'ring-primary-blue', 'ring-primary-red'));
  }, [gridRef]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    // If a spring-back was mid-flight, grab the token wherever it currently is
    // instead of snapping it to origin first.
    x.stop();
    y.stop();
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      tokenX: x.get(),
      tokenY: y.get(),
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [x, y]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    x.set(dragStart.current.tokenX + (e.clientX - dragStart.current.clientX));
    y.set(dragStart.current.tokenY + (e.clientY - dragStart.current.clientY));

    clearHighlights();
    const pokemonId = findCardUnderPoint(e.clientX, e.clientY);
    if (pokemonId !== null && gridRef.current) {
      gridRef.current
        .querySelector(`[data-pokemon-id="${pokemonId}"]`)
        ?.classList.add('ring-4', isPlayer ? 'ring-primary-blue' : 'ring-primary-red');
    }
  }, [isDragging, x, y, gridRef, isPlayer, findCardUnderPoint, clearHighlights]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    clearHighlights();

    const pokemonId = findCardUnderPoint(e.clientX, e.clientY);
    if (pokemonId !== null) {
      onDropOnCard(pokemonId);
    }

    // Spring back home
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    animate(y, 0, { type: 'spring', stiffness: 500, damping: 35 });
  }, [isDragging, x, y, findCardUnderPoint, onDropOnCard, clearHighlights]);

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={clsx(
          'relative w-14 h-14 rounded-full cursor-grab select-none touch-none',
          'flex items-center justify-center border-[3px] shadow-lg',
          isPlayer
            ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 shadow-blue-500/50'
            : 'bg-gradient-to-br from-red-500 to-red-700 border-red-300 shadow-red-500/50',
          isDragging && 'cursor-grabbing shadow-2xl',
          isDragging && (isPlayer ? 'shadow-blue-500/80' : 'shadow-red-500/80'),
        )}
        style={{ x, y, zIndex: isDragging ? 100 : 10 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        animate={isDragging ? { scale: 1.15 } : { scale: [1, 1.05, 1] }}
        transition={
          isDragging
            ? { type: 'spring', stiffness: 400, damping: 25 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <div className={clsx(
          'absolute inset-1 rounded-full opacity-30',
          isPlayer ? 'bg-gradient-to-br from-blue-200 to-transparent' : 'bg-gradient-to-br from-red-200 to-transparent'
        )} />

        <span className="font-orbitron text-sm font-black text-white drop-shadow-lg relative z-10">
          {label}
        </span>

        {isDragging && (
          <motion.div
            className={clsx('absolute inset-0 rounded-full border-2', isPlayer ? 'border-blue-300' : 'border-red-300')}
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </motion.div>

      <span className={clsx('font-rajdhani text-xs font-semibold', isPlayer ? 'text-primary-blue' : 'text-primary-red')}>
        {teamCount}/{maxTeam}
      </span>
    </div>
  );
}