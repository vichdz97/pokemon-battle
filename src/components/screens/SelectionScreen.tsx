import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { usePokemonData } from '../../hooks/usePokemonData';
import { PokemonCard } from '../selection/PokemonCard';
import { CharacterDisplay } from '../selection/CharacterDisplay';
import { StatsPanel } from '../selection/StatsPanel';
import { TeamRoster } from '../selection/TeamRoster';
import { SelectionToken } from '../selection/SelectionToken';
import { GridCard } from '../selection/GridCard';
import { RandomGridCard } from '../selection/RandomGridCard';
import { GlassButton } from '../common/GlassButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pokemon, BattlePokemon } from '../../types/pokemon';
import { createBattlePokemon, getRandomMoves } from '../../services/pokeApi';

const MAX_TEAM_SIZE = 6;
const RANDOM_CARD_ID = -1;

type MobileStep = 'player' | 'cpu' | 'confirm';

export function SelectionScreen() {
  const navigate = useNavigate();
  const { setPlayerTeam, setCpuTeam } = useGame();
  const { pokemon, loading, error } = usePokemonData();

  const [playerTeamSelection, setPlayerTeamSelection] = useState<Pokemon[]>([]);
  const [cpuTeamSelection, setCpuTeamSelection] = useState<Pokemon[]>([]);
  const [hoveredPokemon, setHoveredPokemon] = useState<Pokemon | null>(null);
  const [hoveredPlayerPokemon, setHoveredPlayerPokemon] = useState<Pokemon | null>(null);
  const [hoveredCPUPokemon, setHoveredCPUPokemon] = useState<Pokemon | null>(null);
  const [isPreparingBattle, setIsPreparingBattle] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('player');

  const gridRef = useRef<HTMLDivElement>(null);

  const pickRandomPokemon = useCallback((excludeTeam: Pokemon[]): Pokemon | null => {
    const available = pokemon.filter(p => !excludeTeam.some(s => s.id === p.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }, [pokemon]);

  // --- Desktop handlers ---

  const handlePlayerTokenDrop = useCallback((pokemonId: number) => {
    if (pokemonId === RANDOM_CARD_ID) {
      if (playerTeamSelection.length >= MAX_TEAM_SIZE) return;
      const roll = pickRandomPokemon(playerTeamSelection);
      if (roll) {
        setPlayerTeamSelection(prev => [...prev, roll]);
      }
      return;
    }

    const poke = pokemon.find(p => p.id === pokemonId);
    if (!poke) return;

    const existingIndex = playerTeamSelection.findIndex(p => p.id === poke.id);
    if (existingIndex >= 0) {
      setPlayerTeamSelection(prev => prev.filter((_, i) => i !== existingIndex));
    } else if (playerTeamSelection.length < MAX_TEAM_SIZE) {
      setPlayerTeamSelection(prev => [...prev, poke]);
    }
  }, [pokemon, playerTeamSelection, pickRandomPokemon]);

  const handleCpuTokenDrop = useCallback((pokemonId: number) => {
    if (pokemonId === RANDOM_CARD_ID) {
      if (cpuTeamSelection.length >= MAX_TEAM_SIZE) return;
      const roll = pickRandomPokemon(cpuTeamSelection);
      if (roll) {
        setCpuTeamSelection(prev => [...prev, roll]);
      }
      return;
    }

    const poke = pokemon.find(p => p.id === pokemonId);
    if (!poke) return;

    const existingIndex = cpuTeamSelection.findIndex(p => p.id === poke.id);
    if (existingIndex >= 0) {
      setCpuTeamSelection(prev => prev.filter((_, i) => i !== existingIndex));
    } else if (cpuTeamSelection.length < MAX_TEAM_SIZE) {
      setCpuTeamSelection(prev => [...prev, poke]);
    }
  }, [pokemon, cpuTeamSelection, pickRandomPokemon]);

  const handleGridCardClick = useCallback((poke: Pokemon) => {
    const inPlayer = playerTeamSelection.some(p => p.id === poke.id);
    const inCpu = cpuTeamSelection.some(p => p.id === poke.id);

    if (!inPlayer && playerTeamSelection.length < MAX_TEAM_SIZE) {
      setPlayerTeamSelection(prev => [...prev, poke]);
    } else if (!inCpu && cpuTeamSelection.length < MAX_TEAM_SIZE) {
      setCpuTeamSelection(prev => [...prev, poke]);
    } else if (inPlayer) {
      setPlayerTeamSelection(prev => prev.filter(p => p.id !== poke.id));
    } else if (inCpu) {
      setCpuTeamSelection(prev => prev.filter(p => p.id !== poke.id));
    }
  }, [playerTeamSelection, cpuTeamSelection]);

  const handleRandomCardClick = useCallback(() => {
    if (playerTeamSelection.length < MAX_TEAM_SIZE) {
      const roll = pickRandomPokemon(playerTeamSelection);
      if (roll) {
        setPlayerTeamSelection(prev => [...prev, roll]);
        return;
      }
    }
    if (cpuTeamSelection.length < MAX_TEAM_SIZE) {
      const roll = pickRandomPokemon(cpuTeamSelection);
      if (roll) {
        setCpuTeamSelection(prev => [...prev, roll]);
      }
    }
  }, [playerTeamSelection, cpuTeamSelection, pickRandomPokemon]);

  const getPlayerSelectionOrder = (poke: Pokemon): number | null => {
    const index = playerTeamSelection.findIndex(p => p.id === poke.id);
    return index >= 0 ? index + 1 : null;
  };

  const getCpuSelectionOrder = (poke: Pokemon): number | null => {
    const index = cpuTeamSelection.findIndex(p => p.id === poke.id);
    return index >= 0 ? index + 1 : null;
  };

  // --- Mobile handlers ---

  const handleSelectPlayer = (poke: Pokemon) => {
    const existingIndex = playerTeamSelection.findIndex(p => p.id === poke.id);
    if (existingIndex >= 0) {
      setPlayerTeamSelection(prev => prev.filter((_, i) => i !== existingIndex));
    } else if (playerTeamSelection.length < MAX_TEAM_SIZE) {
      setPlayerTeamSelection(prev => [...prev, poke]);
    }
  };

  const handleSelectCpu = (poke: Pokemon) => {
    const existingIndex = cpuTeamSelection.findIndex(p => p.id === poke.id);
    if (existingIndex >= 0) {
      setCpuTeamSelection(prev => prev.filter((_, i) => i !== existingIndex));
    } else if (cpuTeamSelection.length < MAX_TEAM_SIZE) {
      setCpuTeamSelection(prev => [...prev, poke]);
    }
  };

  const handleRemovePlayerPokemon = (index: number) => {
    setPlayerTeamSelection(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCpuPokemon = (index: number) => {
    setCpuTeamSelection(prev => prev.filter((_, i) => i !== index));
  };

  // Still used by the mobile "Random Team" buttons
  const chooseRandomTeam = (isPlayer: boolean) => {
    const shuffled = [...pokemon].sort(() => Math.random() - 0.5);
    const team = shuffled.slice(0, MAX_TEAM_SIZE);
    if (isPlayer) setPlayerTeamSelection(team);
    else setCpuTeamSelection(team);
  };

  const handleMobilePlayerConfirm = () => {
    if (playerTeamSelection.length > 0) setMobileStep('cpu');
  };

  const handleMobileCpuConfirm = () => {
    if (cpuTeamSelection.length > 0) setMobileStep('confirm');
  };

  const handleMobileEdit = (target: 'player' | 'cpu') => {
    setMobileStep(target);
  };

  const prepareBattlePokemon = async (pokemon: Pokemon): Promise<BattlePokemon> => {
    const moves = await getRandomMoves(pokemon);
    const baseBattlePokemon = createBattlePokemon(pokemon, 50);
    return { ...baseBattlePokemon, selectedMoves: moves };
  };

  const handleStartBattle = async () => {
    if (playerTeamSelection.length === 0 || cpuTeamSelection.length === 0) return;
    setIsPreparingBattle(true);
    try {
      const [playerBattleTeam, cpuBattleTeam] = await Promise.all([
        Promise.all(playerTeamSelection.map(prepareBattlePokemon)),
        Promise.all(cpuTeamSelection.map(prepareBattlePokemon)),
      ]);
      setPlayerTeam(playerBattleTeam);
      setCpuTeam(cpuBattleTeam);
      navigate('/battle');
    } catch (error) {
      console.error('Failed to prepare battle:', error);
      setIsPreparingBattle(false);
    }
  };

  if (loading || isPreparingBattle) {
    return <LoadingSpinner message={isPreparingBattle ? 'Preparing battle...' : 'Loading Pokémon...'} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-orbitron text-2xl text-primary-red mb-4">Error loading Pokémon</h2>
          <p className="font-rajdhani text-gray-400 mb-6">{error}</p>
          <GlassButton variant="blue" onClick={() => navigate('/')}>
            Return Home
          </GlassButton>
        </div>
      </div>
    );
  }

  const lastSelectedPlayer = playerTeamSelection.length > 0 ? playerTeamSelection[playerTeamSelection.length - 1] : null;
  const lastSelectedCpu = cpuTeamSelection.length > 0 ? cpuTeamSelection[cpuTeamSelection.length - 1] : null;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent">
      <h1 className="opacity-0 md:opacity-10 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron text-[20rem] font-bold pointer-events-none select-none">
        VS
      </h1>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex flex-col max-w-[1400px] mx-auto gap-4 h-[calc(100vh-3rem)]">
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left Panel - Player */}
          <div className="w-64 flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-blue animate-pulse" />
              <h2 className="font-orbitron text-sm text-primary-blue uppercase tracking-wider">Player 1</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <CharacterDisplay pokemon={lastSelectedPlayer} side="player" />
            </div>
            <StatsPanel pokemon={lastSelectedPlayer || hoveredPokemon} />
            <TeamRoster
              team={playerTeamSelection}
              maxSize={MAX_TEAM_SIZE}
              side="player"
              onRemove={handleRemovePlayerPokemon}
            />
          </div>

          {/* Center - Grid */}
          <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
            <div className="flex items-center justify-between px-2">
              <SelectionToken
                side="player"
                label="P1"
                gridRef={gridRef}
                onDropOnCard={handlePlayerTokenDrop}
                teamCount={playerTeamSelection.length}
                maxTeam={MAX_TEAM_SIZE}
              />

              <div className="text-center">
                <h2 className="font-orbitron text-lg text-tekken-gold uppercase tracking-widest">
                  Choose Your Fighters
                </h2>
                <p className="font-rajdhani text-xs text-gray-500 mt-0.5">
                  Drag tokens onto Pokémon or click to select
                </p>
              </div>

              <SelectionToken
                side="cpu"
                label="P2"
                gridRef={gridRef}
                onDropOnCard={handleCpuTokenDrop}
                teamCount={cpuTeamSelection.length}
                maxTeam={MAX_TEAM_SIZE}
              />
            </div>

            {/* Grid */}
            <div
              ref={gridRef}
              className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              <div className="grid grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 p-2">
                <RandomGridCard onClick={handleRandomCardClick} />
                {pokemon.map((poke) => (
                  <GridCard
                    key={poke.id}
                    pokemon={poke}
                    playerOrder={getPlayerSelectionOrder(poke)}
                    cpuOrder={getCpuSelectionOrder(poke)}
                    onHover={setHoveredPokemon}
                    onClick={handleGridCardClick}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - CPU */}
          <div className="w-64 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-end gap-2">
              <h2 className="font-orbitron text-sm text-primary-red uppercase tracking-wider">Player 2</h2>
              <div className="w-3 h-3 rounded-full bg-primary-red animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <CharacterDisplay pokemon={lastSelectedCpu} side="cpu" />
            </div>
            <StatsPanel pokemon={lastSelectedCpu || hoveredPokemon} />
            <TeamRoster
              team={cpuTeamSelection}
              maxSize={MAX_TEAM_SIZE}
              side="cpu"
              onRemove={handleRemoveCpuPokemon}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="flex justify-center gap-4 py-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <GlassButton variant="gray" size="large" onClick={() => navigate('/')}>
            ← Back
          </GlassButton>
          <GlassButton
            variant="red"
            size="large"
            onClick={handleStartBattle}
            disabled={playerTeamSelection.length === 0 || cpuTeamSelection.length === 0}
          >
            Start Battle! ({playerTeamSelection.length} vs {cpuTeamSelection.length})
          </GlassButton>
        </motion.div>
      </div>

      {/* ===== MOBILE LAYOUT (unchanged) ===== */}
      <div className="md:hidden relative overflow-hidden min-h-[calc(100vh-2rem)]">
        <AnimatePresence mode="wait">
          {mobileStep === 'player' && (
            <motion.div
              key="player-step"
              className="flex flex-col gap-4 h-full"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-base text-primary-blue uppercase text-center">Build Your Team</h2>

              <div className="flex items-center justify-center">
                <motion.div className="flex-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <StatsPanel pokemon={lastSelectedPlayer} />
                </motion.div>
                <div className="flex-2">
                  <CharacterDisplay pokemon={lastSelectedPlayer} side="player" />
                </div>
              </div>

              <div className="self-center">
                <TeamRoster team={playerTeamSelection} maxSize={MAX_TEAM_SIZE} side="player" onRemove={handleRemovePlayerPokemon} />
              </div>

              <div className="flex flex-col items-center justify-center gap-3 overflow-y-auto flex-1">
                <GlassButton variant="yellow" size="small" onClick={() => chooseRandomTeam(true)}>Random Team</GlassButton>
                <div className="grid grid-cols-4 gap-2">
                  {pokemon.map((poke) => (
                    <PokemonCard
                      key={poke.id}
                      pokemon={poke}
                      isPlayer={true}
                      isSelected={playerTeamSelection.some(p => p.id === poke.id)}
                      isDisabled={playerTeamSelection.length >= MAX_TEAM_SIZE && !playerTeamSelection.some(p => p.id === poke.id)}
                      selectionOrder={getPlayerSelectionOrder(poke)}
                      onSelect={() => handleSelectPlayer(poke)}
                      onHover={setHoveredPlayerPokemon}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <GlassButton variant="gray" size="medium" className="flex-1" onClick={() => navigate('/')}>← Back</GlassButton>
                <GlassButton variant="blue" size="medium" className="flex-1" onClick={handleMobilePlayerConfirm} disabled={playerTeamSelection.length === 0}>
                  Next →
                </GlassButton>
              </div>
            </motion.div>
          )}

          {mobileStep === 'cpu' && (
            <motion.div
              key="cpu-step"
              className="flex flex-col gap-4 h-full"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-base text-primary-red uppercase text-center">Opponent's Team</h2>

              <div className="flex items-center justify-center">
                <motion.div className="flex-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <StatsPanel pokemon={lastSelectedCpu} />
                </motion.div>
                <div className="flex-2">
                  <CharacterDisplay pokemon={lastSelectedCpu} side="cpu" />
                </div>
              </div>

              <div className="self-center">
                <TeamRoster team={cpuTeamSelection} maxSize={MAX_TEAM_SIZE} side="cpu" onRemove={handleRemoveCpuPokemon} />
              </div>

              <div className="flex flex-col items-center justify-center gap-3 overflow-y-auto flex-1">
                <GlassButton variant="yellow" size="small" onClick={() => chooseRandomTeam(false)}>Random Team</GlassButton>
                <div className="grid grid-cols-4 gap-2">
                  {pokemon.map((poke) => (
                    <PokemonCard
                      key={poke.id}
                      pokemon={poke}
                      isPlayer={false}
                      isSelected={cpuTeamSelection.some(p => p.id === poke.id)}
                      isDisabled={cpuTeamSelection.length >= MAX_TEAM_SIZE && !cpuTeamSelection.some(p => p.id === poke.id)}
                      selectionOrder={getCpuSelectionOrder(poke)}
                      onSelect={() => handleSelectCpu(poke)}
                      onHover={setHoveredCPUPokemon}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <GlassButton variant="gray" size="medium" className="flex-1" onClick={() => setMobileStep('player')}>← Back</GlassButton>
                <GlassButton variant="blue" size="medium" className="flex-1" onClick={handleMobileCpuConfirm} disabled={cpuTeamSelection.length === 0}>
                  Confirm
                </GlassButton>
              </div>
            </motion.div>
          )}

          {mobileStep === 'confirm' && (
            <motion.div
              key="confirm-step"
              className="h-full flex flex-col items-center justify-center gap-6"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-lg text-tekken-gold uppercase tracking-wider">Battle Preview</h2>

              <div className="w-full px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-orbitron text-sm text-primary-blue uppercase">Your Team</h3>
                  <GlassButton variant="yellow" size="small" onClick={() => handleMobileEdit('player')}>Edit</GlassButton>
                </div>
                <div className="bg-tekken-panel/80 backdrop-blur-xl border border-primary-blue/20 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {playerTeamSelection.map((poke, index) => (
                      <div key={poke.id} className="w-1/4 flex flex-col items-center gap-1">
                        <div className="relative">
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-blue flex items-center justify-center z-10">
                            <span className="text-[8px] font-bold text-white">{index + 1}</span>
                          </div>
                          <img src={poke.sprites.other.home.front_default || poke.sprites.front_default} alt={poke.name} className="w-12 h-12 object-contain" />
                        </div>
                        <span className="font-rajdhani text-[10px] text-gray-300 capitalize truncate w-full text-center">{poke.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full px-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-blue to-transparent" />
                <span className="font-orbitron text-2xl font-black text-tekken-gold">VS</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-red to-transparent" />
              </div>

              <div className="w-full px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-orbitron text-sm text-primary-red uppercase">Opponent's Team</h3>
                  <GlassButton variant="yellow" size="small" onClick={() => handleMobileEdit('cpu')}>Edit</GlassButton>
                </div>
                <div className="bg-tekken-panel/80 backdrop-blur-xl border border-primary-red/20 rounded-lg p-3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {cpuTeamSelection.map((poke, index) => (
                      <div key={poke.id} className="w-1/4 flex flex-col items-center gap-1">
                        <div className="relative">
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-red flex items-center justify-center z-10">
                            <span className="text-[8px] font-bold text-white">{index + 1}</span>
                          </div>
                          <img src={poke.sprites.other.home.front_default || poke.sprites.front_default} alt={poke.name} className="w-12 h-12 object-contain" />
                        </div>
                        <span className="font-rajdhani text-[10px] text-gray-300 capitalize truncate w-full text-center">{poke.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full px-4">
                <GlassButton variant="gray" size="medium" className="flex-1" onClick={() => setMobileStep('cpu')}>← Back</GlassButton>
                <GlassButton variant="red" size="medium" className="flex-1" onClick={handleStartBattle}>Battle!</GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}