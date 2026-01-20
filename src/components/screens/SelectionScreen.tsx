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
  const [hoveredPokemon, setHoveredPokemon] = useState<Pokemon | null>(null);
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

  const handleRandomCpu = () => {
    const available = pokemon.filter(p => p.id !== selectedPlayer?.id);
    if (available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      setSelectedCpu(available[randomIndex]);
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="font-orbitron text-4xl font-bold text-gradient-title uppercase mb-2">
            Select Your Pokémon
          </h1>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Player selection */}
          <div className="col-span-3">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-orbitron text-lg text-primary-blue uppercase mb-4">Your Pokémon</h2>
              <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto scrollbar-thin p-2">
                {pokemon.map((poke) => (
                  <PokemonCard
                    key={poke.id}
                    pokemon={poke}
                    isSelected={selectedPlayer?.id === poke.id}
                    isDisabled={false}
                    onSelect={() => handleSelectPlayer(poke)}
                    onHover={setHoveredPokemon}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center displays */}
          <div className="col-span-6">
            <div className="grid grid-cols-2 gap-6">
              <CharacterDisplay pokemon={selectedPlayer} side="player" />
              <CharacterDisplay pokemon={selectedCpu} side="cpu" />
            </div>
            
            {/* Stats panel */}
            <motion.div
              className="mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <StatsPanel pokemon={hoveredPokemon} />
            </motion.div>
          </div>

          {/* CPU selection */}
          <div className="col-span-3">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-lg text-primary-red uppercase">Opponent</h2>
                <GlassButton
                  variant="yellow"
                  size="small"
                  onClick={handleRandomCpu}
                >
                  Random
                </GlassButton>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto scrollbar-thin p-2">
                {pokemon.map((poke) => (
                  <PokemonCard
                    key={poke.id}
                    pokemon={poke}
                    isSelected={selectedCpu?.id === poke.id}
                    isDisabled={false}
                    onSelect={() => handleSelectCpu(poke)}
                    onHover={setHoveredPokemon}
                  />
                ))}
              </div>
            </motion.div>
          </div>
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
            Back
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