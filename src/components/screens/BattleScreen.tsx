import { useState, useEffect, useRef, useCallback } from 'react';
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
import { BattleLog } from '../battle/BattleLog';
import { createDefaultStatStages } from '../../utils/battleCalculations';

type MenuState = 'action' | 'moves' | 'bag' | 'pokemon' | 'bag-target-heal' | 'bag-target-revive';

export function BattleScreen() {
  const navigate = useNavigate();
  const { 
    gameState, 
    useItem, 
    resetInventory, 
    setPlayerTeam, 
    setCpuTeam, 
    setActivePlayerIndex, 
    setActiveCpuIndex 
  } = useGame();

  const [menuState, setMenuState] = useState<MenuState>('action');
  const [localPlayerTeam, setLocalPlayerTeam] = useState<BattlePokemon[]>([]);
  const [localCpuTeam, setLocalCpuTeam] = useState<BattlePokemon[]>([]);
  const [localPlayerIndex, setLocalPlayerIndex] = useState(0);
  const [localCpuIndex, setLocalCpuIndex] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize local state from game state once
  useEffect(() => {
    if (gameState.playerTeam.length === 0 || gameState.cpuTeam.length === 0) {
      navigate('/selection');
      return;
    }
    
    if (!initialized && !isResetting) {
      // Deep clone the teams to avoid shared references
      setLocalPlayerTeam(gameState.playerTeam.map(p => ({ 
        ...p, 
        selectedMoves: p.selectedMoves.map(m => ({ ...m }))
      })));
      setLocalCpuTeam(gameState.cpuTeam.map(p => ({ 
        ...p, 
        selectedMoves: p.selectedMoves.map(m => ({ ...m }))
      })));
      setLocalPlayerIndex(gameState.activePlayerIndex);
      setLocalCpuIndex(gameState.activeCpuIndex);
      setInitialized(true);
    }
  }, [gameState, navigate, initialized, isResetting]);

  // Play battle music
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/src/assets/sounds/battle.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5; // 50% volume
    }

    const battleMusic = audioRef.current;

    const playMusic = async () => {
      try {
        battleMusic.currentTime = 0; // Reset audio to beginning to prevent overlapping
        await battleMusic.play();
      } catch (e) {
        console.log('Audio play failed:', e);
      }
    };
    playMusic();

    // Cleanup
    return () => {
      if (battleMusic) {
        battleMusic.pause();
        battleMusic.currentTime = 0;
      }
    };
  }, []);

  const fadeOutMusic = () => {
    if (!audioRef.current) return;
    const fadeInterval = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > 0) {
        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.01);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  };

  const handleSetPlayerIndex = useCallback((index: number) => {
    setLocalPlayerIndex(index);
    setActivePlayerIndex(index);
  }, [setActivePlayerIndex]);

  const handleSetCpuIndex = useCallback((index: number) => {
    setLocalCpuIndex(index);
    setActiveCpuIndex(index);
  }, [setActiveCpuIndex]);

  const handleUpdatePlayerTeam = useCallback((updater: (team: BattlePokemon[]) => BattlePokemon[]) => {
    setLocalPlayerTeam(prev => {
      const updated = updater(prev);
      return updated;
    });
  }, []);

  const handleUpdateCpuTeam = useCallback((updater: (team: BattlePokemon[]) => BattlePokemon[]) => {
    setLocalCpuTeam(prev => {
      const updated = updater(prev);
      return updated;
    });
  }, []);

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
    handleSetCpuIndex,
    handleUpdatePlayerTeam,
    handleUpdateCpuTeam
  );

  const activePlayer = localPlayerTeam[localPlayerIndex];
  const activeCpu = localCpuTeam[localCpuIndex];

  if (!initialized || !activePlayer || !activeCpu) return null;

  const canSwitch = localPlayerTeam.some((p, i) => i !== localPlayerIndex && p.currentHp > 0);

  const handleMoveSelect = (move: BattleMove) => {
    if (move.currentPp > 0 && !isProcessing) {
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
      // Check for injured Pokémon
      const injuredPokemon = localPlayerTeam.filter(p => p.currentHp > 0 && p.currentHp < p.maxHp);
      
      if (injuredPokemon.length === 0) return;

      if (injuredPokemon.length > 1) {
        // Multiple injured Pokémon — player picks a target
        setPendingItem(item);
        setMenuState('bag-target-heal');
      } else {
        // Exactly one injured Pokémon — heal it directly
        const targetIndex = localPlayerTeam.findIndex(p => p.currentHp > 0 && p.currentHp < p.maxHp);
        applyHealingItem(item, targetIndex >= 0 ? targetIndex : localPlayerIndex);
      }
    } else if (item.type === 'revive') {
      const faintedPokemon = localPlayerTeam.filter(p => p.currentHp <= 0);
      
      if (faintedPokemon.length === 0) return;
      
      if (faintedPokemon.length > 1) {
        // Show target selection for revive
        setPendingItem(item);
        setMenuState('bag-target-revive');
      } else {
        // Only one fainted Pokemon
        const faintedIndex = localPlayerTeam.findIndex(p => p.currentHp <= 0);
        if (faintedIndex >= 0) {
          applyReviveItem(item, faintedIndex);
        }
      }
    }
  };

  const applyHealingItem = async (item: Item, targetIndex: number) => {
    const target = localPlayerTeam[targetIndex];
    if (!target || target.currentHp <= 0 || target.currentHp >= target.maxHp) return;

    const healAmount = item.id === 'max-potion' 
      ? target.maxHp - target.currentHp 
      : Math.min(item.effect?.heal || 0, target.maxHp - target.currentHp);

    if (healAmount > 0) {
      setLocalPlayerTeam(prev => {
        const updated = prev.map((p, i) => {
          if (i === targetIndex) {
            return {
              ...p,
              currentHp: Math.min(p.maxHp, p.currentHp + healAmount)
            };
          }
          return p;
        });
        return updated;
      });
      useItem(item.id);
      useItemAndEndTurn(item.name, healAmount);
      setPendingItem(null);
      setMenuState('action');
    }
  };

  const applyReviveItem = async (item: Item, targetIndex: number) => {
    const target = localPlayerTeam[targetIndex];
    if (!target || target.currentHp > 0) return;

    const reviveAmount = item.id === 'max-revive'
      ? target.maxHp
      : Math.floor(target.maxHp / 2);

    setLocalPlayerTeam(prev => {
      const updated = prev.map((p, i) => {
        if (i === targetIndex) {
          return {
            ...p,
            currentHp: reviveAmount
          };
        }
        return p;
      });
      return updated;
    });
    useItem(item.id);
    useItemAndEndTurn(item.name, reviveAmount);
    setPendingItem(null);
    setMenuState('action');
  };

  const handleHealTargetSelect = (index: number) => {
    if (pendingItem) {
      applyHealingItem(pendingItem, index);
    }
  };

  const handleReviveTargetSelect = (index: number) => {
    if (pendingItem) {
      applyReviveItem(pendingItem, index);
    }
  };

  const handleRematch = async () => {
    if (gameState.playerTeam.length === 0 || gameState.cpuTeam.length === 0) return;

    setIsResetting(true);
    setInitialized(false);

    try {
      const [freshPlayerTeam, freshCpuTeam] = await Promise.all([
        Promise.all(gameState.playerTeam.map(async (p) => {
          const moves = await getRandomMoves(p);
          return { 
            ...p, 
            currentHp: p.maxHp, 
            selectedMoves: moves.map(m => ({ ...m })),
            statStages: createDefaultStatStages(),
            flashFireActive: false,
          };
        })),
        Promise.all(gameState.cpuTeam.map(async (p) => {
          const moves = await getRandomMoves(p);
          return { 
            ...p, 
            currentHp: p.maxHp, 
            selectedMoves: moves.map(m => ({ ...m })),
            statStages: createDefaultStatStages(),
            flashFireActive: false,
          };
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
      setPendingItem(null);
      setInitialized(true);
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
        <img src="/src/assets/images/bg-mobile.png" alt="Desktop Background" className="h-screen object-cover" />
      </div>
      <div className="absolute hidden md:block">
        <img src="/src/assets/images/bg.jpeg" alt="Mobile Background" className="h-screen object-cover" />
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
        <BattleLog showMessage={showMessage} message={currentMessage} />
      </div>

      {/* ===== ACTION SECTION ===== */}
      {!battleEnded && (
        <div className="h-[34vh] md:h-auto md:absolute md:bottom-4 md:right-4 z-10 border-t border-white/10 md:border-0 bg-tekken-dark/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-3 md:p-0 flex items-center justify-center">
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
                  onRun={() => {
                    handleRun();
                    fadeOutMusic();
                  }}
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

              {!showForcedSwitch && menuState === 'bag-target-heal' && (
                <ItemTargetMenu
                  team={localPlayerTeam}
                  mode="heal"
                  itemName={pendingItem?.name || ''}
                  onSelect={handleHealTargetSelect}
                  onBack={() => {
                    setPendingItem(null);
                    setMenuState('bag');
                  }}
                />
              )}

              {!showForcedSwitch && menuState === 'bag-target-revive' && (
                <ItemTargetMenu
                  team={localPlayerTeam}
                  mode="revive"
                  itemName={pendingItem?.name || ''}
                  onSelect={handleReviveTargetSelect}
                  onBack={() => {
                    setPendingItem(null);
                    setMenuState('bag');
                  }}
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

// ============ Item Target Selection Component ============

interface ItemTargetMenuProps {
  team: BattlePokemon[];
  mode: 'heal' | 'revive';
  itemName: string;
  onSelect: (index: number) => void;
  onBack: () => void;
}

function ItemTargetMenu({ team, mode, itemName, onSelect, onBack }: ItemTargetMenuProps) {
  const eligiblePokemon = team.map((p, i) => ({ pokemon: p, index: i })).filter(({ pokemon }) => {
    if (mode === 'heal') {
      return pokemon.currentHp > 0 && pokemon.currentHp < pokemon.maxHp;
    } else {
      return pokemon.currentHp <= 0;
    }
  });

  return (
    <motion.div
      className="w-full md:w-96 space-y-3"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-tekken-panel/95 backdrop-blur-xl border border-white/10 rounded-lg p-3">
        <p className="font-rajdhani text-sm text-gray-300 mb-3 text-center">
          Use <span className="text-tekken-gold font-semibold">{itemName}</span> on which Pokémon?
        </p>
        <div className="space-y-2 max-h-40 md:max-h-80 overflow-y-auto scrollbar-thin">
          {eligiblePokemon.map(({ pokemon, index }) => (
            <motion.button
              key={`${pokemon.id}-${index}`}
              className={`w-full p-2.5 rounded-lg border-2 flex items-center gap-3 transition-all duration-200
                ${mode === 'heal' 
                  ? 'bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-500/30 hover:border-green-500/60' 
                  : 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-500/30 hover:border-yellow-500/60'
                }`}
              onClick={() => onSelect(index)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <img
                src={pokemon.sprites.other.home.front_default || pokemon.sprites.front_default}
                alt={pokemon.name}
                className={`w-10 h-10 object-contain ${mode === 'revive' ? 'grayscale' : ''}`}
              />
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-2">
                  <span className="font-orbitron text-sm font-semibold text-white capitalize">
                    {pokemon.name}
                  </span>
                  <span className="font-rajdhani text-xs text-gray-400">
                    Lv.{pokemon.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        mode === 'revive' ? 'bg-red-500' : 
                        (pokemon.currentHp / pokemon.maxHp) > 0.5 ? 'bg-green-500' : 
                        (pokemon.currentHp / pokemon.maxHp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100)}%` }}
                    />
                  </div>
                  <span className="font-orbitron text-[10px] text-gray-300">
                    {pokemon.currentHp}/{pokemon.maxHp}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <GlassButton
        variant="gray"
        className="w-full bg-tekken-panel/60"
        size="small"
        onClick={onBack}
      >
        ← Back
      </GlassButton>
    </motion.div>
  );
}