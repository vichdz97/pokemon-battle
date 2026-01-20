import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { calculateDamage, checkAccuracy, selectCpuMove } from '../../utils/battleCalculations';
import { getEffectivenessMessage } from '../../utils/typeEffectiveness'; 
import { PokemonSprite } from '../battle/PokemonSprite';
import { ActionMenu } from '../battle/ActionMenu';
import { MoveSelector } from '../battle/MoveSelector';
import { BagMenu } from '../battle/BagMenu';
import { useBattleLogic } from '../battle/BattleLogic';
import { GlassButton } from '../common/GlassButton';
import { BattleMove } from '../../types/pokemon';
import { Item } from '../../types/items';

type MenuState = 'action' | 'moves' | 'bag';

export function BattleScreen() {
  const navigate = useNavigate();
  const { gameState, useItem, addBattleLog } = useGame();
  const [menuState, setMenuState] = useState<MenuState>('action');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [finalMessage, setFinalMessage] = useState<string>('');
  const [showMessage, setShowMessage] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [cpuAttacking, setCpuAttacking] = useState(false);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [cpuDamaged, setCpuDamaged] = useState(false);

  const { playerPokemon, cpuPokemon } = gameState;

  useEffect(() => {
    if (!playerPokemon || !cpuPokemon) {
      navigate('/selection');
    }
  }, [playerPokemon, cpuPokemon, navigate]);

  if (!playerPokemon || !cpuPokemon) {
    return null;
  }

  const displayMessage = (message: string) => {
    if (message.includes('win') || message.includes('lost')) {
      setFinalMessage(message);
    } 
    else {
      setCurrentMessage(message);
      setShowMessage(true);
    }
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const handlePlayerAttack = (damage: number) => {
    setPlayerAttacking(true);
    setTimeout(() => {
      setPlayerAttacking(false);
      setCpuDamaged(true);
      cpuPokemon.currentHp = Math.max(0, cpuPokemon.currentHp - damage);
      setTimeout(() => setCpuDamaged(false), 1000);
    }, 1000);
  };

  const handleCpuAttack = (damage: number) => {
    setCpuAttacking(true);
    setTimeout(() => {
      setCpuAttacking(false);
      setPlayerDamaged(true);
      playerPokemon.currentHp = Math.max(0, playerPokemon.currentHp - damage);
      setTimeout(() => setPlayerDamaged(false), 1000);
    }, 1000);
  };

  const handleBattleEnd = (winner: 'player' | 'cpu') => {
    const message = winner === 'player' 
      ? 'You win! Congratulations!' 
      : 'You lost. Better luck next time!';
    
    addBattleLog(message);
    displayMessage(message);
  };

  const handleBattleLog = (message: string) => {
    addBattleLog(message);
    displayMessage(message);
  };

  const { processTurn, isProcessing, isBattleActive } = useBattleLogic({
    playerPokemon,
    cpuPokemon,
    onPlayerAttack: handlePlayerAttack,
    onCpuAttack: handleCpuAttack,
    onBattleEnd: handleBattleEnd,
    onBattleLog: handleBattleLog,
  });

  const handleMoveSelect = (move: BattleMove) => {
    if (move.currentPp > 0) {
      move.currentPp--;
      processTurn(move);
      setMenuState('action');
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleUseItem = async (item: Item) => {
    if (item.type === 'healing' && playerPokemon) {
      const healAmount = item.effect?.heal || 0;
      const actualHeal = Math.min(healAmount, playerPokemon.maxHp - playerPokemon.currentHp);
      
      if (actualHeal > 0) {
        playerPokemon.currentHp = Math.min(playerPokemon.maxHp, playerPokemon.currentHp + healAmount);
        useItem(item.id);
        displayMessage(`Used ${item.name}! Restored ${actualHeal} HP.`);
        
        // End turn after using item - trigger CPU attack with proper timing
        await delay(2500);
        
        const cpuMove = selectCpuMove(cpuPokemon);
        if (cpuMove && cpuMove.currentPp > 0) {
          cpuMove.currentPp--;
          
          displayMessage(`${cpuPokemon.name} used ${cpuMove.name}!`);
          await delay(2000);
          
          if (!checkAccuracy(cpuMove)) {
            displayMessage("Attack missed!");
            setMenuState('action');
            return;
          }
          
          const { damage, effectiveness, isCritical } = calculateDamage(
            cpuPokemon,
            playerPokemon,
            cpuMove
          );

          console.log('currentHP', playerPokemon.currentHp)
          console.log('damage', damage)
          
          handleCpuAttack(damage);
          console.log('newHP', playerPokemon.currentHp)
          await delay(1000);
          
          if (isCritical) {
            displayMessage('A critical hit!');
            await delay(2000);
          }
          
          const effectivenessMsg = getEffectivenessMessage(effectiveness);
          if (effectivenessMsg) {
            displayMessage(effectivenessMsg);
            await delay(2000);
          }
          
          if (playerPokemon.currentHp - damage <= 0) {
            await delay(500);
            displayMessage(`${playerPokemon.name} fainted!`);
            await delay(2000);
            handleBattleEnd('cpu');
          } else {
            setMenuState('action');
          }
        }
        
        setMenuState('action');
      } else {
        displayMessage('HP is already full!');
      }
    } else if (item.type === 'revive' && playerPokemon) {
      if (playerPokemon.currentHp <= 0) {
        const reviveAmount = Math.floor(playerPokemon.maxHp / 2);
        playerPokemon.currentHp = reviveAmount;
        useItem(item.id);
        displayMessage(`Used ${item.name}! ${playerPokemon.name} was revived!`);
        setMenuState('action');
      } else {
        displayMessage('Pokemon is not fainted!');
      }
    }
  };

  const handleRun = () => {
    displayMessage("Can't run from a trainer battle!");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent relative overflow-hidden">
      {/* Battle arena */}
      <div className="flex-1 relative p-4">
        {/* CPU Pokemon - upper right */}
        <div className="absolute top-8 right-8">
          <PokemonSprite
            pokemon={cpuPokemon}
            isPlayer={false}
            isAttacking={cpuAttacking}
            isTakingDamage={cpuDamaged}
            isFainted={cpuPokemon.currentHp <= 0}
          />
        </div>
        
        {/* Player Pokemon - bottom left */}
        <div className="absolute bottom-32 left-8">
          <PokemonSprite
            pokemon={playerPokemon}
            isPlayer={true}
            isAttacking={playerAttacking}
            isTakingDamage={playerDamaged}
            isFainted={playerPokemon.currentHp <= 0}
          />
        </div>
      </div>

      {/* Battle log - appears at bottom when message is shown */}
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

      {!isBattleActive && (playerPokemon.currentHp <= 0 || cpuPokemon.currentHp <= 0) ? (
        <div className='absolute inset-0 flex items-center justify-center backdrop-blur-sm z-20'>
          <AnimatePresence mode='wait'>
            <motion.div
              key="game-over"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-md h-md flex flex-col items-center gap-4 bg-tekken-panel border border-white/20 rounded-lg p-4"
            >
              <h2 className="font-orbitron text-xl text-tekken-gold mb-3">
                {finalMessage}
              </h2>
              <GlassButton variant="blue" size="medium" onClick={() => navigate('/')}>
                Return Home
              </GlassButton>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className='absolute bottom-4 right-4 z-20'>
          <AnimatePresence mode='wait'>
            <motion.div key={menuState}>
              {menuState === 'action' && (
                <ActionMenu
                  onFight={() => setMenuState('moves')}
                  onBag={() => setMenuState('bag')}
                  onRun={handleRun}
                  disabled={isProcessing}
                />
              )}
              
              {menuState === 'moves' && (
                <MoveSelector
                  moves={playerPokemon.selectedMoves}
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