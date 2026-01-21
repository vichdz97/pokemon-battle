import axios from 'axios';
import { Pokemon, Move, BattleMove } from '../types/pokemon';
import { POKEMON_ROSTER } from '../utils/pokemonRoster';

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

  const pokemonPromises = POKEMON_ROSTER.map(pokemon => getPokemonById(pokemon.id));
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
  const selectedMoves = shuffled.slice(0, Math.min(count * 4, shuffled.length));
  
  const movePromises = selectedMoves.map((m) => 
    getMoveByName(m.move.name).catch(() => null)
  );
  
  const moves = await Promise.all(movePromises);
  const validMoves = moves
    .filter((m): m is Move => m !== null && m.power !== null && m.power > 0)
    .slice(0, count)
    .map((move): BattleMove => ({
      ...move,
      currentPp: move.pp,
      maxPp: move.pp,
    }));
  
  // If we don't have enough damage moves, fill with any moves
  if (validMoves.length < count) {
    const remainingMoves = moves
      .filter((m): m is Move => m !== null && !validMoves.find(v => v.id === m.id))
      .slice(0, count - validMoves.length)
      .map((move): BattleMove => ({
        ...move,
        currentPp: move.pp,
        maxPp: move.pp,
      }));
    return [...validMoves, ...remainingMoves];
  }
  
  return validMoves;
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