import { motion, AnimatePresence } from 'framer-motion';
import { typeColors } from '../../utils/typeEffectiveness';

const conditionColor: Record<string, string> = {
  paralysis:        '#F8D030',
  burn:             '#F08030',
  poison:           '#A040A0',
  'badly-poisoned': '#A040A0',
  sleep:            '#A8A878',
  freeze:           '#98D8D8',
  confusion:        '#F85888'
};

const conditionLabel: Record<string, string> = {
  paralysis:        'PAR!',
  burn:             'BRN!',
  poison:           'PSN!',
  'badly-poisoned': 'TOX!',
  sleep:            'SLP!',
  freeze:           'FRZ!',
  confusion:        'CNF!'
};

// ─── Stat Change (rendered inside PokemonSprite, after the sprite img) ───────

interface StatChangeAnimationProps {
  isIncrease: boolean;
  visible: boolean;
}

export function StatChangeAnimation({ isIncrease, visible }: StatChangeAnimationProps) {
  const color       = isIncrease ? '#FF4444' : '#4488FF';
  const shadowColor = isIncrease ? 'rgba(255,68,68,0.9)' : 'rgba(68,136,255,0.9)';
  const arrow       = isIncrease ? '▲' : '▼';
  const yStart      = isIncrease ?  30 : -30;
  const yEnd        = isIncrease ? -90 :  90;

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: 50, overflow: 'visible' }}
        >
          {/* Central burst */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 90,
              height: 90,
              backgroundColor: color,
              boxShadow: `0 0 40px 10px ${shadowColor}`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.7, 0.4, 0], scale: [0, 1.6, 2.2, 0] }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />

          {/* Outer ring */}
          <motion.div
            className="absolute rounded-full border-4"
            style={{ width: 120, height: 120, borderColor: color, boxShadow: `0 0 20px ${shadowColor}` }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0], scale: [0.2, 2] }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />

          {/* Floating energy particles */}
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 8 + (i % 3) * 4,
                height: 8 + (i % 3) * 4,
                backgroundColor: color,
                boxShadow: `0 0 10px ${shadowColor}`,
                left: `${28 + (i * 7) % 44}%`,
              }}
              initial={{ y: yStart, opacity: 0, scale: 0 }}
              animate={{ y: [yStart, yEnd], opacity: [0, 1, 1, 0], scale: [0, 1.3, 1, 0] }}
              transition={{ duration: 0.95, delay: i * 0.07, ease: 'easeOut' }}
            />
          ))}

          {/* Big arrow */}
          <motion.div
            className="absolute font-black select-none"
            style={{
              fontSize: 52,
              lineHeight: 1,
              color,
              textShadow: `0 0 16px ${shadowColor}, 0 0 32px ${shadowColor}`,
              top: isIncrease ? '5%' : 'auto',
              bottom: isIncrease ? 'auto' : '5%',
            }}
            initial={{ opacity: 0, y: isIncrease ? 20 : -20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [isIncrease ? 20 : -20, isIncrease ? -15 : 15] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {arrow}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Special Move: full-screen laser (rendered fixed in BattleScreen) ────────

export interface SpecialMoveAnimationProps {
  visible: boolean;
  moveType: string;
  isPlayer: boolean;
}

export function SpecialMoveAnimation({ visible, moveType, isPlayer }: SpecialMoveAnimationProps) {
  const color = typeColors[moveType] ?? '#FFFFFF';

  // Approximate sprite centres as % of the full viewport (0-100 viewbox units).
  // Player sprite: bottom-left → ~(20, 65)
  // CPU sprite:    top-right   → ~(74, 32)
  const PX = 20, PY = 65;
  const CX = 74, CY = 32;

  const x1 = isPlayer ? PX : CX;
  const y1 = isPlayer ? PY : CY;
  const x2 = isPlayer ? CX : PX;
  const y2 = isPlayer ? CY : PY;

  const length = Math.hypot(x2 - x1, y2 - y1); // ≈ 60 viewbox units

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Wide outer glow beam */}
            <motion.line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#laser-glow)"
              initial={{ strokeDasharray: `0 ${length}`, opacity: 0 }}
              animate={{
                strokeDasharray: [`0 ${length}`, `${length} 0`, `${length} 0`],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Bright core */}
            <motion.line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ strokeDasharray: `0 ${length}`, opacity: 0 }}
              animate={{
                strokeDasharray: [`0 ${length}`, `${length} 0`, `${length} 0`],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Muzzle flash at origin */}
            <motion.circle
              cx={x1} cy={y1}
              fill={color}
              filter="url(#laser-glow)"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [0, 6, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />

            {/* Impact burst at target */}
            <motion.circle
              cx={x2} cy={y2}
              fill={color}
              filter="url(#laser-glow)"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [0, 0, 10, 0], opacity: [0, 0, 1, 0] }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />

            {/* Impact ring */}
            <motion.circle
              cx={x2} cy={y2}
              fill="none"
              stroke={color}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              initial={{ r: 0, opacity: 0 }}
              animate={{ r: [0, 0, 14, 0], opacity: [0, 0, 0.8, 0] }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
          </svg>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Condition Animation: fixed overlay shown when a status/volatile applies ─

export interface ConditionAnimationState {
  visible: boolean;
  condition: string; // StatusCondition | VolatileCondition
  isPlayer: boolean;
}

export function ConditionAnimation({ visible, condition, isPlayer }: ConditionAnimationState) {
  const color = conditionColor[condition] ?? '#FFFFFF';
  const label = conditionLabel[condition] ?? '!';
  const shadowColor = color;

  // Fixed position near each sprite
  // Player: lower-left  CPU: upper-right
  const posStyle: React.CSSProperties = isPlayer
    ? { left: '4%',  top: '48%', transform: 'translateY(-50%)' }
    : { right: '4%', top: '8%' };

  const PARTICLE_COUNT = 10;

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="fixed pointer-events-none z-50 flex items-center justify-center"
          style={{ width: 220, height: 220, ...posStyle }}
        >
          {/* Big radial explosion */}
          <motion.div
            className="absolute rounded-full"
            style={{
              background: `radial-gradient(circle, white 0%, ${color} 35%, transparent 70%)`,
              boxShadow: `0 0 60px 20px ${shadowColor}`,
            }}
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width:   [0, 260, 180, 0],
              height:  [0, 260, 180, 0],
              opacity: [0, 1,   0.7, 0],
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          {/* Radiating particles */}
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const dist  = 90 + (i % 3) * 20;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 10 + (i % 3) * 4,
                  height: 10 + (i % 3) * 4,
                  backgroundColor: color,
                  boxShadow: `0 0 12px 4px ${shadowColor}`,
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: [0, Math.cos(angle) * dist],
                  y: [0, Math.sin(angle) * dist],
                  opacity: [0, 1, 0],
                  scale:   [0, 1.4, 0],
                }}
                transition={{ duration: 0.9, delay: 0.08, ease: 'easeOut' }}
              />
            );
          })}

          {/* Condition label */}
          <motion.div
            className="absolute font-orbitron font-black text-white select-none"
            style={{
              fontSize: 52,
              textShadow: `0 0 20px ${shadowColor}, 0 0 50px ${shadowColor}`,
            }}
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{
              opacity: [0, 1,   1,   0],
              scale:   [0.4, 1.4, 1.1, 0.8],
              y:       [10, 0,   0,   -10],
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            {label}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}