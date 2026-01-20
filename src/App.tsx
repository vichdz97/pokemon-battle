import { Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { HomeScreen } from './components/screens/HomeScreen';
import { SelectionScreen } from './components/screens/SelectionScreen';
import { BattleScreen } from './components/screens/BattleScreen';

function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/selection" element={<SelectionScreen />} />
        <Route path="/battle" element={<BattleScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}

export default App;