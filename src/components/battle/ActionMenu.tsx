import { motion } from 'framer-motion';
import { GlassButton } from '../common/GlassButton';

interface ActionMenuProps {
  onFight: () => void;
  onPokemon: () => void;
  onBag: () => void;
  onRun: () => void;
  disabled?: boolean;
  canSwitch?: boolean;
}

export function ActionMenu({ onFight, onPokemon, onBag, onRun, disabled = false, canSwitch = true }: ActionMenuProps) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-2 w-full h-full md:flex md:flex-col md:gap-2 md:w-56"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassButton
        variant="blue"
        size="medium"
        onClick={onFight}
        disabled={disabled}
        className="w-full bg-gradient-to-br from-tekken-dark/60 to-primary-blue/50"
      >
        Fight
      </GlassButton>

      <GlassButton
        variant="red"
        size="medium"
        onClick={onPokemon}
        disabled={disabled || !canSwitch}
        className="w-full bg-gradient-to-br from-tekken-dark/60 to-primary-red/50"
      >
        Pokémon
      </GlassButton>

      <GlassButton
        variant="yellow"
        size="medium"
        onClick={onBag}
        disabled={disabled}
        className="w-full bg-gradient-to-br from-tekken-dark/60 to-yellow-500/50"
      >
        Bag
      </GlassButton>

      <GlassButton
        variant="gray"
        size="medium"
        onClick={onRun}
        disabled={disabled}
        className="w-full bg-gradient-to-br from-tekken-dark/60 to-gray-500/50"
      >
        Run
      </GlassButton>
    </motion.div>
  );
}