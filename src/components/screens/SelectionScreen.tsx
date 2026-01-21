import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { usePokemonData } from '../../hooks/usePokemonData';
import { PokemonCard } from '../selection/PokemonCard';
import { CharacterDisplay } from '../selection/CharacterDisplay';
import { StatsPanel } from '../selection/StatsPanel';
import { GlassButton } from '../common/GlassButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pokemon, BattlePokemon } from '../../types/pokemon';
import { getRandomMoves } from '../../services/pokeApi';

type MobileStep = 'player' | 'cpu' | 'confirm';

export function SelectionScreen() {
  const navigate = useNavigate();
  const { setPlayerPokemon, setCpuPokemon } = useGame();
  const { pokemon, loading, error } = usePokemonData();

  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedCpu, setSelectedCpu] = useState<Pokemon | null>(null);
  const [hoveredPlayerPokemon, setHoveredPlayerPokemon] = useState<Pokemon | null>(null);
  const [hoveredCPUPokemon, setHoveredCPUPokemon] = useState<Pokemon | null>(null);
  const [isPreparingBattle, setIsPreparingBattle] = useState(false);
  const [mobileStep, setMobileStep] = useState<MobileStep>('player');

  const handleSelectPlayer = (poke: Pokemon) => {
    if (selectedPlayer?.id === poke.id) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer(poke);
    }
  };

  const handleSelectCpu = (poke: Pokemon) => {
    if (selectedCpu?.id === poke.id) {
      setSelectedCpu(null);
    } else {
      setSelectedCpu(poke);
    }
  };

  const chooseRandomPokemon = (isPlayer: boolean) => {
    const randomIndex = Math.floor(Math.random() * pokemon.length);
    isPlayer ? setSelectedPlayer(pokemon[randomIndex]) : setSelectedCpu(pokemon[randomIndex]);
  };

  const handleMobilePlayerConfirm = () => {
    if (selectedPlayer) {
      setMobileStep('cpu');
    }
  };

  const handleMobileCpuConfirm = () => {
    if (selectedCpu) {
      setMobileStep('confirm');
    }
  };

  const handleMobileEdit = (target: 'player' | 'cpu') => {
    setMobileStep(target);
  };

  const handleStartBattle = async () => {
    if (!selectedPlayer || !selectedCpu) return;

    setIsPreparingBattle(true);

    try {
      const [playerMoves, cpuMoves] = await Promise.all([
        getRandomMoves(selectedPlayer),
        getRandomMoves(selectedCpu),
      ]);

      const playerBattlePokemon: BattlePokemon = {
        ...selectedPlayer,
        currentHp: selectedPlayer.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
        maxHp: selectedPlayer.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
        level: 50,
        selectedMoves: playerMoves,
      };

      const cpuBattlePokemon: BattlePokemon = {
        ...selectedCpu,
        currentHp: selectedCpu.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
        maxHp: selectedCpu.stats.find(s => s.stat.name === 'hp')?.base_stat || 100,
        level: 50,
        selectedMoves: cpuMoves,
      };

      setPlayerPokemon(playerBattlePokemon);
      setCpuPokemon(cpuBattlePokemon);

      navigate('/battle');
    } catch (error) {
      console.error('Failed to prepare battle:', error);
      setIsPreparingBattle(false);
    }
  };

  if (loading || isPreparingBattle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="large"
          message={isPreparingBattle ? "Preparing battle..." : "Loading Pokémon..."}
        />
      </div>
    );
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

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent">
      <h1 className="opacity-0 md:opacity-10 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron text-6xl md:text-9xl font-bold pointer-events-none">VS</h1>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-7xl mx-auto">
        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {/* Player's Pokémon display */}
          <div className="flex flex-col gap-4">
            <h2 className="font-orbitron text-lg text-primary-blue uppercase">Your Pokémon</h2>
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <StatsPanel pokemon={selectedPlayer || hoveredPlayerPokemon} />
              </motion.div>
              <div className="flex-1">
                <CharacterDisplay pokemon={selectedPlayer || hoveredPlayerPokemon} side="player" />
              </div>
            </div>
          </div>

          {/* CPU's Pokémon display */}
          <div className="flex flex-col gap-4">
            <h2 className="self-end font-orbitron text-lg text-primary-red uppercase">Opponent's Pokémon</h2>
            <div className="flex items-center justify-center">
              <div className="flex-1">
                <CharacterDisplay pokemon={selectedCpu || hoveredCPUPokemon} side="cpu" />
              </div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <StatsPanel pokemon={selectedCpu || hoveredCPUPokemon} />
              </motion.div>
            </div>
          </div>

          {/* Player selection */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <GlassButton variant="yellow" size="small" onClick={() => chooseRandomPokemon(true)}>
              Random
            </GlassButton>
            <div className="grid grid-cols-8 gap-2 overflow-y-auto scrollbar-thin p-2">
              {pokemon.map((poke) => (
                <PokemonCard
                  key={poke.id}
                  pokemon={poke}
                  isPlayer={true}
                  isSelected={selectedPlayer?.id === poke.id}
                  isDisabled={false}
                  onSelect={() => handleSelectPlayer(poke)}
                  onHover={setHoveredPlayerPokemon}
                />
              ))}
            </div>
          </motion.div>

          {/* CPU selection */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <GlassButton variant="yellow" size="small" onClick={() => chooseRandomPokemon(false)}>
              Random
            </GlassButton>
            <div className="grid grid-cols-8 gap-2 overflow-y-auto scrollbar-thin p-2">
              {pokemon.map((poke) => (
                <PokemonCard
                  key={poke.id}
                  pokemon={poke}
                  isPlayer={false}
                  isSelected={selectedCpu?.id === poke.id}
                  isDisabled={false}
                  onSelect={() => handleSelectCpu(poke)}
                  onHover={setHoveredCPUPokemon}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Battle button */}
        <motion.div
          className="flex justify-center mt-8 gap-4"
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
            disabled={!selectedPlayer || !selectedCpu}
          >
            Start Battle!
          </GlassButton>
        </motion.div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative overflow-hidden min-h-[calc(100vh-2rem)]">
        <AnimatePresence mode="wait">
          {/* Step 1: Player Selection */}
          {mobileStep === 'player' && (
            <motion.div
              key="player-step"
              className="flex flex-col gap-6 h-full"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-base text-primary-blue uppercase text-center">
                Choose Your Pokémon
              </h2>

              {/* Player Character Display */}
              <div className="flex items-center justify-center">
                {/* Stats Panel (compact) */}
                {(selectedPlayer) && (
                  <motion.div
                    className="flex-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <StatsPanel pokemon={selectedPlayer} />
                  </motion.div>
                )}
                <div className="flex-2">
                  <CharacterDisplay pokemon={selectedPlayer} side="player" />
                </div>
              </div>

              {/* Pokemon Grid */}
              <div className="flex flex-col items-center justify-center gap-4 overflow-y-auto">
                <GlassButton variant="yellow" size="small" onClick={() => chooseRandomPokemon(true)}>
                  Random
                </GlassButton>
                <div className="grid grid-cols-4 gap-2">
                  {pokemon.map((poke) => (
                    <PokemonCard
                      key={poke.id}
                      pokemon={poke}
                      isPlayer={true}
                      isSelected={selectedPlayer?.id === poke.id}
                      isDisabled={false}
                      onSelect={() => handleSelectPlayer(poke)}
                      onHover={setHoveredPlayerPokemon}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <GlassButton variant="gray" size="medium" className="flex-1" onClick={() => navigate('/')}>
                  ← Back
                </GlassButton>
                <GlassButton
                  variant="blue"
                  size="medium"
                  className="flex-1"
                  onClick={handleMobilePlayerConfirm}
                  disabled={!selectedPlayer}
                >
                  Next →
                </GlassButton>
              </div>
            </motion.div>
          )}

          {/* Step 2: CPU Selection */}
          {mobileStep === 'cpu' && (
            <motion.div
              key="cpu-step"
              className="flex flex-col gap-6 h-full"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-base text-primary-red uppercase text-center">
                Choose Opponent's Pokémon
              </h2>

              {/* CPU Character Display */}
              <div className="flex items-center justify-center">
                {/* Stats Panel (compact) */}
                {(selectedCpu) && (
                  <motion.div
                    className="flex-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <StatsPanel pokemon={selectedCpu} />
                  </motion.div>
                )}
                <div className="flex-2">
                  <CharacterDisplay pokemon={selectedCpu} side="cpu" />
                </div>
              </div>


              {/* Pokemon Grid */}
              <div className="flex flex-col items-center justify-center gap-4 overflow-y-auto">
                <GlassButton variant="yellow" size="small" onClick={() => chooseRandomPokemon(false)}>
                  Random
                </GlassButton>
                <div className="grid grid-cols-4 gap-2">
                  {pokemon.map((poke) => (
                    <PokemonCard
                      key={poke.id}
                      pokemon={poke}
                      isPlayer={false}
                      isSelected={selectedCpu?.id === poke.id}
                      isDisabled={false}
                      onSelect={() => handleSelectCpu(poke)}
                      onHover={setHoveredCPUPokemon}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <GlassButton variant="gray" size="medium" className="flex-1" onClick={() => setMobileStep('player')}>
                  ← Back
                </GlassButton>
                <GlassButton
                  variant="blue"
                  size="medium"
                  className="flex-1"
                  onClick={handleMobileCpuConfirm}
                  disabled={!selectedCpu}
                >
                  Confirm
                </GlassButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {mobileStep === 'confirm' && (
            <motion.div
              key="confirm-step"
              className="h-full flex flex-col items-center justify-center gap-6"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <h2 className="font-orbitron text-lg text-tekken-gold uppercase tracking-wider">
                Battle Preview
              </h2>

              {/* VS Display */}
              <div className="relative grid grid-cols-2 gap-10 w-full px-4">
                {/* Player Pokemon */}
                <div className="flex flex-col items-center gap-4">
                  <CharacterDisplay pokemon={selectedPlayer} side="player" />
                  <GlassButton variant="yellow" size="small" onClick={() => handleMobileEdit('player')}>
                    Change
                  </GlassButton>
                </div>

                {/* VS Text */}
                <div className="absolute top-1/2 left-1/2 -translate-1/2">
                  <span className="font-orbitron text-3xl font-black text-tekken-gold opacity-80">
                    VS
                  </span>
                </div>

                {/* CPU Pokemon */}
                <div className="flex flex-col items-center gap-4">
                  <CharacterDisplay pokemon={selectedCpu} side="cpu" />
                  <GlassButton variant="yellow" size="small" onClick={() => handleMobileEdit('cpu')}>
                    Change
                  </GlassButton>
                </div>
              </div>

              {/* Stats Comparison */}
              <div className="w-full">
                <div className="bg-tekken-panel/80 backdrop-blur-xl border border-white/10 rounded-lg p-3">
                  <h4 className="font-orbitron text-xs text-tekken-gold uppercase text-center mb-2">
                    Stats Comparison
                  </h4>
                  {selectedPlayer && selectedCpu && (
                    <div className="flex flex-col justify-evenly h-50">
                      {['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].map((statName) => {
                        const playerStat = selectedPlayer.stats.find(s => s.stat.name === statName)?.base_stat || 0;
                        const cpuStat = selectedCpu.stats.find(s => s.stat.name === statName)?.base_stat || 0;
                        const statLabel = statName === 'attack' ? 'ATK' :
                          statName === 'special-attack' ? 'SP.ATK' :
                          statName === 'special-defense' ? 'SP.DEF' :
                          statName === 'speed' ? 'SPD' :
                            statName.toUpperCase().slice(0, 3);

                        return (
                          <div key={statName} className="flex items-center gap-2">
                            <span className={`font-orbitron text-[10px] w-8 text-right ${playerStat > cpuStat ? 'text-green-400' : 'text-gray-400' }`}>
                              {playerStat}
                            </span>
                            <div className="flex-1 flex items-center gap-1">
                              <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden flex justify-end">
                                <motion.div
                                  className="h-full bg-primary-blue rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (playerStat / 200) * 100)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              <span className="font-rajdhani text-[9px] text-gray-500 w-10 text-center">
                                {statLabel}
                              </span>
                              <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary-red rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (cpuStat / 200) * 100)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                            <span className={`font-orbitron text-[10px] w-8 ${cpuStat > playerStat ? 'text-green-400' : 'text-gray-400'}`}>
                              {cpuStat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full">
                <GlassButton
                  variant="gray"
                  size="medium"
                  className="flex-1"
                  onClick={() => setMobileStep('cpu')}
                >
                  ← Back
                </GlassButton>
                <GlassButton
                  variant="blue"
                  size="medium"
                  className="flex-1"
                  onClick={handleStartBattle}
                >
                  Battle!
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}