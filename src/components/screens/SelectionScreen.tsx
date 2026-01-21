import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { usePokemonData } from '../../hooks/usePokemonData';
import { PokemonCard } from '../selection/PokemonCard';
import { CharacterDisplay } from '../selection/CharacterDisplay';
import { StatsPanel } from '../selection/StatsPanel';
import { GlassButton } from '../common/GlassButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pokemon, BattlePokemon } from '../../types/pokemon';
import { getRandomMoves } from '../../services/pokeApi';

export function SelectionScreen() {
  const navigate = useNavigate();
  const { setPlayerPokemon, setCpuPokemon } = useGame();
  const { pokemon, loading, error } = usePokemonData();
  
  const [selectedPlayer, setSelectedPlayer] = useState<Pokemon | null>(null);
  const [selectedCpu, setSelectedCpu] = useState<Pokemon | null>(null);
  const [hoveredPlayerPokemon, setHoveredPlayerPokemon] = useState<Pokemon | null>(null);
  const [hoveredCPUPokemon, setHoveredCPUPokemon] = useState<Pokemon | null>(null);
  const [isPreparingBattle, setIsPreparingBattle] = useState(false);

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
    <div className="min-h-screen p-6 bg-gradient-to-br from-tekken-dark via-tekken-panel to-tekken-accent">
      <h1 className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron text-9xl font-bold opacity-10">VS</h1>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          {/* Player's Pokémon display */}
          <div className="flex flex-col gap-4">
            <h2 className="font-orbitron text-lg text-primary-blue uppercase">Your Pokémon</h2>
            <div className="flex items-center justify-center">
              {/* Stats panel */}
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
              {/* Stats panel */}
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
          <GlassButton
            variant="gray"
            size="large"
            onClick={() => navigate('/')}
          >
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
    </div>
  );
}