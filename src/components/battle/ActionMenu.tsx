import { motion } from 'framer-motion';
import { GlassButton } from '../common/GlassButton';

interface ActionMenuProps {
  onFight: () => void;
  onBag: () => void;
  onRun: () => void;
  disabled?: boolean;
}

export function ActionMenu({ onFight, onBag, onRun, disabled = false }: ActionMenuProps) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-2 w-full h-full md:flex md:flex-col md:gap-2 md:w-56"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassButton
        variant="red"
        size="medium"
        onClick={onFight}
        disabled={disabled}
        className="w-full"
      >
        Fight
      </GlassButton>

      <GlassButton
        variant="blue"
        size="medium"
        onClick={() => {}}
        disabled={disabled}
        className="w-full"
      >
        Pokémon
      </GlassButton>

      <GlassButton
        variant="yellow"
        size="medium"
        onClick={onBag}
        disabled={disabled}
        className="w-full"
      >
        Bag
      </GlassButton>

      <GlassButton
        variant="gray"
        size="medium"
        onClick={onRun}
        disabled={disabled}
        className="w-full"
      >
        Run
      </GlassButton>
    </motion.div>
  );
}