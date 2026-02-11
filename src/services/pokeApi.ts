import axios from 'axios';
import { Pokemon, Move, BattleMove, BattlePokemon } from '../types/pokemon';
import { POKEMON_ROSTER } from '../utils/pokemonRoster';
import { createDefaultStatStages } from '../utils/battleCalculations';

const BASE_URL = 'https://pokeapi.co/api/v2';

const api = axios.create({
  baseURL: BASE_URL,
});

const cache: Map<string, any> = new Map();

export const getPokemonById = async (id: number): Promise<Pokemon> => {
  const cacheKey = `pokemon-id-${id}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await api.get(`/pokemon/${id}`);
  cache.set(cacheKey, response.data);
  return response.data;
};

export const getRosterPokemon = async (): Promise<Pokemon[]> => {
  const cacheKey = 'roster-pokemon';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const pokemonPromises = POKEMON_ROSTER.map(pokemonId => getPokemonById(pokemonId));
  const results = await Promise.all(pokemonPromises);
  cache.set(cacheKey, results);
  return results;
};

export const getMoveByName = async (name: string): Promise<Move> => {
  const cacheKey = `move-${name}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await api.get(`/move/${name}`);
  cache.set(cacheKey, response.data);
  return response.data;
};

export const getRandomMoves = async (pokemon: Pokemon, count: number = 4): Promise<BattleMove[]> => {
  const allMoves = pokemon.moves;
  const shuffled = [...allMoves].sort(() => Math.random() - 0.5);
  const selectedMoves = shuffled.slice(0, Math.min(count * 6, shuffled.length));
  
  const movePromises = selectedMoves.map((m) => 
    getMoveByName(m.move.name).catch(() => null)
  );
  
  const moves = await Promise.all(movePromises);
  
  // Separate damaging moves and status moves
  const damagingMoves = moves.filter((m): m is Move => 
    m !== null && m.power !== null && m.power > 0
  );
  
  const statusMoves = moves.filter((m): m is Move => 
    m !== null && m.damage_class.name === 'status' && 
    (m.stat_changes.length > 0 || (m.meta !== null && m.meta.ailment.name !== 'none'))
  );
  
  // Take up to 3 damaging moves and 1 status move for variety
  const selectedDamaging = damagingMoves.slice(0, Math.min(3, count));
  const selectedStatus = statusMoves.slice(0, Math.min(1, count - selectedDamaging.length));
  
  const finalMoves = [...selectedDamaging, ...selectedStatus]
    .slice(0, count)
    .map((move): BattleMove => ({
      ...move,
      currentPp: move.pp,
      maxPp: move.pp,
    }));
  
  // If we don't have enough moves, fill with any valid moves
  if (finalMoves.length < count) {
    const remainingMoves = moves
      .filter((m): m is Move => m !== null && !finalMoves.find(v => v.id === m.id))
      .slice(0, count - finalMoves.length)
      .map((move): BattleMove => ({
        ...move,
        currentPp: move.pp,
        maxPp: move.pp,
      }));
    return [...finalMoves, ...remainingMoves];
  }
  
  return finalMoves;
};

// Creates a BattlePokemon from a Pokemon with initialized battle state
export const createBattlePokemon = (pokemon: Pokemon, level: number = 50): Omit<BattlePokemon, 'selectedMoves'> => {
  const hpStat = pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
  const maxHp = Math.floor(((2 * hpStat * level) / 100) + level + 10);
  
  return {
    ...pokemon,
    currentHp: maxHp,
    maxHp,
    level,
    statStages: createDefaultStatStages(),
    flashFireActive: false,
    status: null,
    statusTurns: 0,
    volatileConditions: [],
    confusionTurns: 0,
  };
};

export const getSprite = (pokemon: Pokemon, isBack: boolean = false): string => {
  if (isBack) {
    return pokemon.sprites.other?.showdown?.back_default || 
           pokemon.sprites.back_default || 
           pokemon.sprites.front_default;
  }
  return pokemon.sprites.other?.showdown?.front_default ||
         pokemon.sprites.other?.['official-artwork']?.front_default || 
         pokemon.sprites.front_default;
};

export const getOfficialArtwork = (pokemon: Pokemon): string => {
  return pokemon.sprites.other?.['official-artwork']?.front_default || 
         pokemon.sprites.front_default;
};

export const getPokemonHomeArtwork = (pokemon: Pokemon): string => {
  return pokemon.sprites.other.home.front_default ||
         pokemon.sprites.front_default;
};