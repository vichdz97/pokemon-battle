import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton } from '../common/GlassButton';

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
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,51,85,0.3)_0%,transparent_70%)] -top-48 -right-48 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(51,85,255,0.3)_0%,transparent_70%)] -bottom-48 -left-48 pointer-events-none" />
      
      {/* Decorative Pokeballs */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 opacity-10 animate-spin-slow pointer-events-none">
        <div className="absolute w-full h-1/2 bg-primary-red rounded-t-full top-0" />
        <div className="absolute w-full h-1/2 bg-slate-100 rounded-b-full bottom-0" />
        <div className="absolute w-full h-1.5 bg-gray-800 top-1/2 -translate-y-1/2" />
        <div className="absolute w-12 h-12 bg-slate-100 border-4 border-gray-800 rounded-full top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
      </div>
      <div className="absolute bottom-[10%] right-[5%] w-72 h-72 opacity-10 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse' }}>
        <div className="absolute w-full h-1/2 bg-primary-red rounded-t-full top-0" />
        <div className="absolute w-full h-1/2 bg-slate-100 rounded-b-full bottom-0" />
        <div className="absolute w-full h-1.5 bg-gray-800 top-1/2 -translate-y-1/2" />
        <div className="absolute w-12 h-12 bg-slate-100 border-4 border-gray-800 rounded-full top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Title */}
      <motion.h1
        className="font-orbitron text-6xl font-slate-950 uppercase tracking-wider mb-3 drop-shadow-[0_0_30px_rgba(255,51,85,0.5)]"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        Pokémon
      </motion.h1>
      
      <motion.p
        className="font-rajdhani text-xl text-gray-400 tracking-[0.25em] uppercase mb-16 animate-pulse"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        Battle Arena
      </motion.p>
      
      {/* Buttons */}
      <motion.div
        className="flex flex-col gap-5 z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      >
        <GlassButton
          variant="red"
          size="large"
          onClick={handleStartBattle}
        >
          Start Battle
        </GlassButton>
        
        <GlassButton
          variant="blue"
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              className="max-w-xl p-10 m-5 rounded-2xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-neon-blue"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-orbitron text-2xl text-primary-blue text-center mb-6">
                How to Play
              </h2>
              
              <ul className="mb-8 space-y-0">
                {instructions.map((instruction, index) => (
                  <li
                    key={index}
                    className="font-rajdhani text-lg text-white py-3 border-b border-white/10 last:border-0 flex items-start gap-3"
                  >
                    <span className="text-primary-red text-xl">▸</span>
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
};