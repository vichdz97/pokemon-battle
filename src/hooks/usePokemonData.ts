import { useState, useEffect } from 'react';
import { Pokemon } from '../types/pokemon';
import { getRosterPokemon } from '../services/pokeApi';

export function usePokemonData() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRosterPokemon();
        setPokemon(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Pokémon');
      } finally {
        setLoading(false);
      }
    };

    loadPokemon();
  }, []);

  return { pokemon, loading, error };
}