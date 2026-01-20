import { createContext, useContext, useState, ReactNode } from 'react';
import { BattlePokemon } from '../types/pokemon';
import { Item, STARTER_ITEMS } from '../types/items';

interface GameState {
  playerPokemon: BattlePokemon | null;
  cpuPokemon: BattlePokemon | null;
  inventory: Item[];
  battleHistory: string[];
}

interface GameContextType {
  gameState: GameState;
  setPlayerPokemon: (pokemon: BattlePokemon | null) => void;
  setCpuPokemon: (pokemon: BattlePokemon | null) => void;
  updateInventory: (items: Item[]) => void;
  useItem: (itemId: string) => void;
  addBattleLog: (message: string) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    playerPokemon: null,
    cpuPokemon: null,
    inventory: [...STARTER_ITEMS],
    battleHistory: [],
  });

  const setPlayerPokemon = (pokemon: BattlePokemon | null) => {
    setGameState(prev => ({ ...prev, playerPokemon: pokemon }));
  };

  const setCpuPokemon = (pokemon: BattlePokemon | null) => {
    setGameState(prev => ({ ...prev, cpuPokemon: pokemon }));
  };

  const updateInventory = (items: Item[]) => {
    setGameState(prev => ({ ...prev, inventory: items }));
  };

  const useItem = (itemId: string) => {
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ),
    }));
  };

  const addBattleLog = (message: string) => {
    setGameState(prev => ({
      ...prev,
      battleHistory: [...prev.battleHistory, message],
    }));
  };

  const resetGame = () => {
    setGameState({
      playerPokemon: null,
      cpuPokemon: null,
      inventory: [...STARTER_ITEMS],
      battleHistory: [],
    });
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setPlayerPokemon,
        setCpuPokemon,
        updateInventory,
        useItem,
        addBattleLog,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};