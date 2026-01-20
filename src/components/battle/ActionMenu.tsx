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
      className="flex flex-col gap-3 w-64"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassButton
        variant="red"
        size="large"
        onClick={onFight}
        disabled={disabled}
      >
        Fight
      </GlassButton>
      
      <GlassButton
        variant="blue"
        size="large"
        onClick={() => {}}
        disabled={disabled}
      >
        Pokémon
      </GlassButton>

      <GlassButton
        variant="yellow"
        size="large"
        onClick={onBag}
        disabled={disabled}
      >
        Bag
      </GlassButton>
      
      <GlassButton
        variant="gray"
        size="large"
        onClick={onRun}
        disabled={disabled}
      >
        Run
      </GlassButton>
    </motion.div>
  );
}