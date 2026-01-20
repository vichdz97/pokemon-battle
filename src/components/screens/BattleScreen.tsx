import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { PokemonSprite } from '../battle/PokemonSprite';
import { ActionMenu } from '../battle/ActionMenu';
import { MoveSelector } from '../battle/MoveSelector';
import { BagMenu } from '../battle/BagMenu';
import { useBattle } from '../../hooks/useBattle';
import { GlassButton } from '../common/GlassButton';
import { BattleMove, BattlePokemon } from '../../types/pokemon';
import { Item } from '../../types/items';

type MenuState = 'action' | 'moves' | 'bag';

export function BattleScreen() {
  const navigate = useNavigate();
  const { gameState, useItem } = useGame();
  const [menuState, setMenuState] = useState<MenuState>('action');
  const [localPlayer, setLocalPlayer] = useState<BattlePokemon | null>(gameState.playerPokemon);
  const [localCpu, setLocalCpu] = useState<BattlePokemon | null>(gameState.cpuPokemon);

  useEffect(() => {
    if (!gameState.playerPokemon || !gameState.cpuPokemon) {
      navigate('/selection');
    } else {
      setLocalPlayer({ ...gameState.playerPokemon });
      setLocalCpu({ ...gameState.cpuPokemon });
    }
  }, [gameState.playerPokemon, gameState.cpuPokemon, navigate]);

  const {
    currentMessage,
    showMessage,
    playerAttacking,
    cpuAttacking,
    playerDamaged,
    cpuDamaged,
    battleEnded,
    winner,
    isProcessing,
    executeTurn,
    useItemAndEndTurn,
    handleRun
  } = useBattle(localPlayer, localCpu);

  if (!localPlayer || !localCpu) return null;

  const handleMoveSelect = (move: BattleMove) => {
    if (move.currentPp > 0 && !isProcessing) {
      move.currentPp--;
      executeTurn(move);
      setMenuState('action');
    }
  };

  const handleUseItem = (item: Item) => {
    if (isProcessing) return;
    
    if (item.type === 'healing') {
      const healAmount = item.effect?.heal || 0;
      const actualHeal = Math.min(healAmount, localPlayer.maxHp - localPlayer.currentHp);
      
      if (actualHeal > 0) {
        setLocalPlayer(prev => prev ? { ...prev, currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount) } : null);
        useItem(item.id);
        useItemAndEndTurn(item.name, actualHeal);
        setMenuState('action');
      }
    } else if (item.type === 'revive' && localPlayer.currentHp <= 0) {
      const reviveAmount = Math.floor(localPlayer.maxHp / 2);
      setLocalPlayer(prev => prev ? { ...prev, currentHp: reviveAmount } : null);
      useItem(item.id);
      setMenuState('action');
    }
  };

  const getFinalMessage = () => {
    switch (winner) {
      case 'player': return 'You win! Congratulations!';
      case 'cpu': return 'You lost. Better luck next time!';
      default: return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent relative overflow-hidden">
      {/* Battle Arena */}
      <div className="flex-1 relative p-4">
        {/* CPU Pokemon - upper right */}
        <div className="absolute top-8 right-8">
          <PokemonSprite
            pokemon={localCpu}
            isPlayer={false}
            isAttacking={cpuAttacking}
            isTakingDamage={cpuDamaged}
            isFainted={localCpu.currentHp <= 0}
          />
        </div>
        
        {/* Player Pokemon - bottom left */}
        <div className="absolute bottom-32 left-8">
          <PokemonSprite
            pokemon={localPlayer}
            isPlayer={true}
            isAttacking={playerAttacking}
            isTakingDamage={playerDamaged}
            isFainted={localPlayer.currentHp <= 0}
          />
        </div>
      </div>

      {/* Battle Log */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute bottom-20 left-0 right-0 px-6 z-10"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-tekken-panel/95 backdrop-blur-xl border-2 border-white/20 rounded-lg p-4 max-w-3xl mx-auto">
              <p className="font-rajdhani text-lg text-white text-center">
                {currentMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle End Modal */}
      {battleEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-4 bg-tekken-panel border border-white/20 rounded-lg p-8"
          >
            <h2 className="font-orbitron text-2xl text-tekken-gold">
              {getFinalMessage()}
            </h2>
            <GlassButton variant="gray" size="medium" onClick={() => navigate('/')}>
              Return Home
            </GlassButton>
          </motion.div>
        </div>
      )}

      {/* Action Menu */}
      {!battleEnded && (
        <div className="absolute bottom-4 right-4 z-20">
          <AnimatePresence mode="wait">
            <motion.div key={menuState}>
              {menuState === 'action' && (
                <ActionMenu
                  onFight={() => setMenuState('moves')}
                  onBag={() => setMenuState('bag')}
                  onRun={() => handleRun(localPlayer, localCpu)}
                  disabled={isProcessing}
                />
              )}
              
              {menuState === 'moves' && (
                <MoveSelector
                  moves={localPlayer.selectedMoves}
                  onSelectMove={handleMoveSelect}
                  onBack={() => setMenuState('action')}
                  disabled={isProcessing}
                />
              )}
              
              {menuState === 'bag' && (
                <BagMenu
                  items={gameState.inventory}
                  onUseItem={handleUseItem}
                  onBack={() => setMenuState('action')}
                  disabled={isProcessing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}