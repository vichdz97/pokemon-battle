import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton } from '../common/GlassButton';
import { Pokeball } from '../common/Pokeball';

export function HomeScreen() {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStartBattle = () => {
    navigate('/selection');
  };

  const instructions = [
    'Select your Pokémon by clicking on a tile in the left panel',
    "Choose your opponent's Pokémon or use the Random button",
    'Hover over Pokémon tiles to view their stats',
    'Click your selected Pokémon again to unselect it',
    'In battle, the faster Pokémon attacks first each turn',
    'Use the Fight button to select one of four moves',
    'Each move has limited PP - use them wisely!',
    'Type advantages deal 2x damage, disadvantages deal 0.5x',
    "Reduce your opponent's HP to 0 to win the battle!",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[radial-gradient(circle,rgba(255,51,85,0.3)_0%,transparent_70%)] -top-24 md:-top-48 -right-24 md:-right-48 pointer-events-none" />
      <div className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[radial-gradient(circle,rgba(51,85,255,0.3)_0%,transparent_70%)] -bottom-24 md:-bottom-48 -left-24 md:-left-48 pointer-events-none" />

      {/* Decorative Pokeballs */}
      <div className="md:hidden">
        <Pokeball size="medium" transparent={true} orientation="top-[10%] left-[5%]" animation="animate-spin-slow" />
        <Pokeball size="medium" transparent={true} orientation="bottom-[10%] right-[5%]" animation="animate-spin-slow" direction="reverse" />
      </div>
      <div className="hidden md:block">
        <Pokeball size="large" transparent={true} orientation="top-[10%] left-[5%]" animation="animate-spin-slow" />
        <Pokeball size="large" transparent={true} orientation="bottom-[10%] right-[5%]" animation="animate-spin-slow" direction="reverse" />
      </div>

      {/* Title */}
      <motion.h1
        className="font-orbitron text-4xl md:text-6xl font-slate-950 uppercase tracking-wider mb-3 drop-shadow-[0_0_30px_rgba(255,51,85,0.5)]"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Pokémon
      </motion.h1>

      <motion.p
        className="font-rajdhani text-xl text-gray-400 tracking-[0.25em] uppercase mb-10 md:mb-16 animate-pulse"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        Battle Arena
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-5 z-10 w-full max-w-xs md:max-w-none md:w-auto"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      >
        <GlassButton
          variant="blue"
          size="large"
          onClick={handleStartBattle}
        >
          Start Battle
        </GlassButton>

        <GlassButton
          variant="red"
          size="large"
          onClick={() => setShowInstructions(true)}
        >
          Instructions
        </GlassButton>
      </motion.div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              className="max-w-xl w-full p-6 md:p-10 rounded-2xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-neon-blue max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-orbitron text-2xl text-primary-blue text-center mb-4 md:mb-6">
                How to Play
              </h2>

              <ul className="mb-6 md:mb-8 space-y-0">
                {instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="font-rajdhani text-lg text-white py-2 md:py-3 border-b border-white/10 last:border-0 flex items-start gap-2 md:gap-3"
                  >
                    <span className="text-primary-red text-xl flex-shrink-0">▸</span>
                    {instruction}
                  </li>
                ))}
              </ul>

              <GlassButton
                variant="blue"
                className="w-full"
                onClick={() => setShowInstructions(false)}
              >
                Got It!
              </GlassButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}