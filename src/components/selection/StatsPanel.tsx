import { motion, AnimatePresence } from 'framer-motion';
import { Pokemon } from '../../types/pokemon';

interface StatsPanelProps {
  pokemon: Pokemon | null;
}

const statNameMap: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

const getStatColor = (value: number): string => {
  if (value >= 150) return 'from-cyan-400 to-cyan-600';
  if (value >= 120) return 'from-green-400 to-green-600';
  if (value >= 90) return 'from-lime-400 to-lime-600';
  if (value >= 60) return 'from-yellow-400 to-yellow-600';
  return 'from-orange-400 to-orange-600';
};

export function StatsPanel({ pokemon }: StatsPanelProps) {
  return (
    <div className="min-h-48 md:min-h-85 bg-gradient-to-b from-tekken-panel to-tekken-dark border border-white/10 rounded-lg p-3 md:p-4 h-full">
      <h3 className="font-orbitron text-[10px] md:text-sm text-tekken-gold uppercase tracking-widest mb-2 md:mb-4 text-center">
        Stats
      </h3>

      <AnimatePresence mode="wait">
        {pokemon ? (
          <motion.div
            key={pokemon.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 md:space-y-3"
          >
            {pokemon.stats.map((stat, index) => (
              <div key={stat.stat.name} className="space-y-0.5 md:space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-rajdhani text-[10px] md:text-xs font-semibold text-gray-400 uppercase">
                    {statNameMap[stat.stat.name] || stat.stat.name}
                  </span>
                  <span className="font-orbitron text-[10px] md:text-xs font-bold text-white">
                    {stat.base_stat}
                  </span>
                </div>
                <div className="h-1.5 md:h-2 bg-black/50 rounded overflow-hidden">
                  <motion.div
                    className={`h-full rounded bg-gradient-to-r ${getStatColor(stat.base_stat)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stat.base_stat / 150) * 100)}%` }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  />
                </div>
              </div>
            ))}

            {/* Total Stats */}
            <div className="pt-1 md:pt-2 mt-1 md:mt-2 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="font-rajdhani text-[10px] md:text-xs font-semibold text-tekken-gold uppercase">
                  Total
                </span>
                <span className="font-orbitron text-xs md:text-sm font-bold text-tekken-gold">
                  {pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0)}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-32 md:h-50"
          >
            <span className="font-rajdhani text-xs md:text-sm text-gray-600 text-center">
              Hover over a<br />Pokémon to view stats
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}