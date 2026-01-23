import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { PokemonSprite } from '../battle/PokemonSprite';
import { ActionMenu } from '../battle/ActionMenu';
import { MoveSelector } from '../battle/MoveSelector';
import { BagMenu } from '../battle/BagMenu';
import { PokemonSwitchMenu } from '../battle/PokemonSwitchMenu';
import { useBattle } from '../../hooks/useBattle';
import { GlassButton } from '../common/GlassButton';
import { BattleMove, BattlePokemon } from '../../types/pokemon';
import { Item } from '../../types/items';
import { getRandomMoves } from '../../services/pokeApi';

type MenuState = 'action' | 'moves' | 'bag' | 'pokemon';

export function BattleScreen() {
  const navigate = useNavigate();
  const { gameState, useItem, resetInventory, setPlayerTeam, setCpuTeam, setActivePlayerIndex, setActiveCpuIndex } = useGame();
  const [menuState, setMenuState] = useState<MenuState>('action');
  const [localPlayerTeam, setLocalPlayerTeam] = useState<BattlePokemon[]>(gameState.playerTeam);
  const [localCpuTeam, setLocalCpuTeam] = useState<BattlePokemon[]>(gameState.cpuTeam);
  const [localPlayerIndex, setLocalPlayerIndex] = useState(gameState.activePlayerIndex);
  const [localCpuIndex, setLocalCpuIndex] = useState(gameState.activeCpuIndex);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (gameState.playerTeam.length === 0 || gameState.cpuTeam.length === 0) {
      navigate('/selection');
    } else if (!isResetting) {
      setLocalPlayerTeam([...gameState.playerTeam]);
      setLocalCpuTeam([...gameState.cpuTeam]);
      setLocalPlayerIndex(gameState.activePlayerIndex);
      setLocalCpuIndex(gameState.activeCpuIndex);
    }
  }, [gameState.playerTeam, gameState.cpuTeam, gameState.activePlayerIndex, gameState.activeCpuIndex, navigate, isResetting]);

  const handleSetPlayerIndex = (index: number) => {
    setLocalPlayerIndex(index);
    setActivePlayerIndex(index);
  };

  const handleSetCpuIndex = (index: number) => {
    setLocalCpuIndex(index);
    setActiveCpuIndex(index);
  };

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
    forcedSwitch,
    executeTurn,
    executePlayerSwitch,
    useItemAndEndTurn,
    handleRun,
    resetBattle
  } = useBattle(
    localPlayerTeam,
    localCpuTeam,
    localPlayerIndex,
    localCpuIndex,
    handleSetPlayerIndex,
    handleSetCpuIndex
  );

  const activePlayer = localPlayerTeam[localPlayerIndex];
  const activeCpu = localCpuTeam[localCpuIndex];

  if (!activePlayer || !activeCpu) return null;

  const canSwitch = localPlayerTeam.some((p, i) => i !== localPlayerIndex && p.currentHp > 0);

  const handleMoveSelect = (move: BattleMove) => {
    if (move.currentPp > 0 && !isProcessing) {
      move.currentPp--;
      executeTurn(move);
      setMenuState('action');
    }
  };

  const handleSwitchPokemon = (index: number) => {
    if (!isProcessing || forcedSwitch === 'player') {
      executePlayerSwitch(index);
      setMenuState('action');
    }
  };

  const handleUseItem = (item: Item) => {
    if (isProcessing) return;

    if (item.type === 'healing') {
      const healAmount = item.effect?.heal || 0;
      const actualHeal = Math.min(healAmount, activePlayer.maxHp - activePlayer.currentHp);

      if (actualHeal > 0) {
        setLocalPlayerTeam(prev => {
          const updated = [...prev];
          updated[localPlayerIndex] = {
            ...updated[localPlayerIndex],
            currentHp: Math.min(updated[localPlayerIndex].maxHp, updated[localPlayerIndex].currentHp + healAmount)
          };
          return updated;
        });
        useItem(item.id);
        useItemAndEndTurn(item.name, actualHeal);
        setMenuState('action');
      }
    } else if (item.type === 'revive') {
      // Find first fainted Pokemon in team
      const faintedIndex = localPlayerTeam.findIndex((p, i) => i !== localPlayerIndex && p.currentHp <= 0);
      if (faintedIndex >= 0) {
        const reviveAmount = item.id === 'max-revive'
          ? localPlayerTeam[faintedIndex].maxHp
          : Math.floor(localPlayerTeam[faintedIndex].maxHp / 2);
        setLocalPlayerTeam(prev => {
          const updated = [...prev];
          updated[faintedIndex] = { ...updated[faintedIndex], currentHp: reviveAmount };
          return updated;
        });
        useItem(item.id);
        useItemAndEndTurn(item.name, reviveAmount);
        setMenuState('action');
      }
    }
  };

  const handleRematch = async () => {
    if (gameState.playerTeam.length === 0 || gameState.cpuTeam.length === 0) return;

    setIsResetting(true);

    try {
      const [freshPlayerTeam, freshCpuTeam] = await Promise.all([
        Promise.all(gameState.playerTeam.map(async (p) => {
          const moves = await getRandomMoves(p);
          return { ...p, currentHp: p.maxHp, selectedMoves: moves };
        })),
        Promise.all(gameState.cpuTeam.map(async (p) => {
          const moves = await getRandomMoves(p);
          return { ...p, currentHp: p.maxHp, selectedMoves: moves };
        }))
      ]);

      setLocalPlayerTeam(freshPlayerTeam);
      setLocalCpuTeam(freshCpuTeam);
      setLocalPlayerIndex(0);
      setLocalCpuIndex(0);
      setPlayerTeam(freshPlayerTeam);
      setCpuTeam(freshCpuTeam);
      setActivePlayerIndex(0);
      setActiveCpuIndex(0);
      resetInventory();
      resetBattle();
      setMenuState('action');
    } catch (error) {
      console.error('Failed to reset battle:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangePokemon = () => {
    navigate('/selection');
  };

  const getFinalMessage = () => {
    switch (winner) {
      case 'player': return 'You win! Congratulations!';
      case 'cpu': return 'You lost. Better luck next time!';
      default: return '';
    }
  };

  // Determine if we should show the forced switch menu
  const showForcedSwitch = forcedSwitch === 'player' && !battleEnded;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent relative overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div className="absolute md:hidden -translate-y-30">
        <img src="/src/assets/bg-mobile.png" alt="Desktop Background" className="h-screen object-cover" />
      </div>
      <div className="absolute hidden md:block">
        <img src="/src/assets/bg.jpeg" alt="Mobile Background" className="h-screen object-cover" />
      </div>
      {/* ===== ARENA SECTION ===== */}
      <div className="flex-1 md:flex-1 h-[66vh] md:h-auto relative p-2 md:p-4 min-h-0">
        {/* CPU Pokemon - upper right */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 scale-75 md:scale-100 origin-top-right">
          <PokemonSprite
            pokemon={activeCpu}
            isPlayer={false}
            isAttacking={cpuAttacking}
            isTakingDamage={cpuDamaged}
            isFainted={activeCpu.currentHp <= 0}
            team={localCpuTeam}
            activeIndex={localCpuIndex}
          />
        </div>

        {/* Player Pokemon - bottom left of arena */}
        <div className="absolute bottom-4 left-4 md:bottom-32 md:left-8 scale-75 md:scale-100 origin-bottom-left">
          <PokemonSprite
            pokemon={activePlayer}
            isPlayer={true}
            isAttacking={playerAttacking}
            isTakingDamage={playerDamaged}
            isFainted={activePlayer.currentHp <= 0}
            team={localPlayerTeam}
            activeIndex={localPlayerIndex}
          />
        </div>

        {/* Battle Log */}
        <AnimatePresence>
          {showMessage && (
            <motion.div
              className="absolute bottom-2 left-2 right-2 md:bottom-20 md:left-0 md:right-0 md:px-6 z-10"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-tekken-panel/95 backdrop-blur-xl border-2 border-white/20 rounded-lg p-3 md:p-4 max-w-3xl mx-auto">
                <p className="font-rajdhani text-sm md:text-lg text-white text-center">
                  {currentMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== ACTION SECTION ===== */}
      {!battleEnded && (
        <div className="h-[34vh] md:h-auto md:absolute md:bottom-4 md:right-4 z-20 border-t border-white/10 md:border-0 bg-tekken-dark/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-3 md:p-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={showForcedSwitch ? 'forced-switch' : menuState}
              className="w-full h-full max-w-md md:max-w-none md:w-auto"
            >
              {showForcedSwitch && (
                <PokemonSwitchMenu
                  team={localPlayerTeam}
                  activeIndex={localPlayerIndex}
                  onSwitch={handleSwitchPokemon}
                  onBack={() => {}}
                  disabled={false}
                  forcedSwitch={true}
                />
              )}

              {!showForcedSwitch && menuState === 'action' && (
                <ActionMenu
                  onFight={() => setMenuState('moves')}
                  onPokemon={() => setMenuState('pokemon')}
                  onBag={() => setMenuState('bag')}
                  onRun={handleRun}
                  disabled={isProcessing}
                  canSwitch={canSwitch}
                />
              )}

              {!showForcedSwitch && menuState === 'moves' && (
                <MoveSelector
                  moves={activePlayer.selectedMoves}
                  onSelectMove={handleMoveSelect}
                  onBack={() => setMenuState('action')}
                  disabled={isProcessing}
                />
              )}

              {!showForcedSwitch && menuState === 'pokemon' && (
                <PokemonSwitchMenu
                  team={localPlayerTeam}
                  activeIndex={localPlayerIndex}
                  onSwitch={handleSwitchPokemon}
                  onBack={() => setMenuState('action')}
                  disabled={isProcessing}
                />
              )}

              {!showForcedSwitch && menuState === 'bag' && (
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

      {/* Battle End Modal */}
      {battleEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-5 bg-tekken-panel border border-white/20 rounded-lg p-6 md:p-8 mx-4 w-full max-w-sm"
          >
            <h2 className="font-orbitron text-xl md:text-2xl text-tekken-gold text-center">
              {getFinalMessage()}
            </h2>

            <div className="flex flex-col gap-3 w-full">
              <GlassButton
                variant="blue"
                size="medium"
                className="w-full"
                onClick={handleRematch}
                disabled={isResetting}
              >
                {isResetting ? 'Preparing...' : 'Rematch'}
              </GlassButton>

              <GlassButton
                variant="red"
                size="medium"
                className="w-full"
                onClick={handleChangePokemon}
              >
                Change Pokémon
              </GlassButton>

              <GlassButton
                variant="gray"
                size="medium"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Return Home
              </GlassButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}