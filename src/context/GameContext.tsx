import { createContext, useContext, useState, ReactNode } from 'react';
import { BattlePokemon } from '../types/pokemon';
import { Item, STARTER_ITEMS } from '../types/items';

interface GameState {
  playerTeam: BattlePokemon[];
  cpuTeam: BattlePokemon[];
  activePlayerIndex: number;
  activeCpuIndex: number;
  inventory: Item[];
  battleHistory: string[];
}

interface GameContextType {
  gameState: GameState;
  setPlayerTeam: (team: BattlePokemon[]) => void;
  setCpuTeam: (team: BattlePokemon[]) => void;
  setActivePlayerIndex: (index: number) => void;
  setActiveCpuIndex: (index: number) => void;
  updateInventory: (items: Item[]) => void;
  useItem: (itemId: string) => void;
  addBattleLog: (message: string) => void;
  resetGame: () => void;
  resetInventory: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    playerTeam: [],
    cpuTeam: [],
    activePlayerIndex: 0,
    activeCpuIndex: 0,
    inventory: [...STARTER_ITEMS],
    battleHistory: [],
  });

  const setPlayerTeam = (team: BattlePokemon[]) => {
    setGameState(prev => ({ ...prev, playerTeam: team }));
  };

  const setCpuTeam = (team: BattlePokemon[]) => {
    setGameState(prev => ({ ...prev, cpuTeam: team }));
  };

  const setActivePlayerIndex = (index: number) => {
    setGameState(prev => ({ ...prev, activePlayerIndex: index }));
  };

  const setActiveCpuIndex = (index: number) => {
    setGameState(prev => ({ ...prev, activeCpuIndex: index }));
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
      playerTeam: [],
      cpuTeam: [],
      activePlayerIndex: 0,
      activeCpuIndex: 0,
      inventory: [...STARTER_ITEMS],
      battleHistory: [],
    });
  };

  const resetInventory = () => {
    setGameState(prev => ({
      ...prev,
      inventory: [...STARTER_ITEMS],
      battleHistory: [],
    }));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        setPlayerTeam,
        setCpuTeam,
        setActivePlayerIndex,
        setActiveCpuIndex,
        updateInventory,
        useItem,
        addBattleLog,
        resetGame,
        resetInventory,
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