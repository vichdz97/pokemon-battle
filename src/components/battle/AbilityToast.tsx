import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface AbilityToastProps {
  pokemonName: string;
  abilityName: string;
  isPlayer: boolean;
  visible: boolean;
}

export function AbilityToast({ pokemonName, abilityName, isPlayer, visible }: AbilityToastProps) {
  const formatName = (name: string) =>
    name.split('-').map(n => n[0].toUpperCase() + n.slice(1)).join(' ');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={clsx(
            'fixed z-50 flex items-center',
            isPlayer ? 'left-0 top-1/2 -translate-y-1/2' : 'right-0 top-1/2 -translate-y-1/2'
          )}
          initial={{ x: isPlayer ? -300 : 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isPlayer ? -300 : 300, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 25,
          }}
        >
          <div
            className={clsx(
              'flex items-center gap-3 py-2.5 px-5',
              'backdrop-blur-md border shadow-lg',
              isPlayer
                ? 'bg-primary-blue/80 border-primary-blue/40 rounded-r-xl pr-6 shadow-neon-blue'
                : 'bg-primary-red/80 border-primary-red/40 rounded-l-xl pl-6 shadow-neon-red'
            )}
          >
            {/* Small decorative bar on the inner edge */}
            <div
              className={clsx(
                'absolute top-0 bottom-0 w-1',
                isPlayer
                  ? 'right-0 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-300'
                  : 'left-0 bg-gradient-to-b from-red-300 via-red-400 to-red-300'
              )}
            />

            <div className={clsx(
              'flex flex-col',
              isPlayer ? 'items-start' : 'items-end'
            )}>
              <span className='font-orbitron text-sm text-slate-100 font-bold'>
                {formatName(pokemonName)}'s
              </span>
              <span className='font-orbitron text-sm text-slate-100 font-bold'>
                {formatName(abilityName)}
              </span>
              <span className='font-rajdhani text-xs uppercase tracking-wider text-slate-100'>
                Ability
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}