import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Item } from '../../types/items';
import { GlassButton } from '../common/GlassButton';

interface BagMenuProps {
  items: Item[];
  onUseItem: (item: Item) => void;
  onBack: () => void;
  disabled?: boolean;
}

export function BagMenu({ items, onUseItem, onBack, disabled = false }: BagMenuProps) {
  const usableItems = items.filter(i => 
    (i.type === 'healing' || i.type === 'revive' || i.type === 'pp-restore') && i.quantity > 0
  );

  const getItemStyle = (item: Item) => {
    switch (item.type) {
      case 'revive':
        return {
          bg: 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20',
          border: 'border-yellow-500/30 hover:border-yellow-500/50',
          text: 'text-yellow-400'
        };
      case 'pp-restore':
        return {
          bg: 'bg-gradient-to-r from-indigo-900/20 to-purple-800/20',
          border: 'border-indigo-500/30 hover:border-indigo-500/50',
          text: 'text-indigo-400'
        };
      case 'healing':
      default:
        return {
          bg: 'bg-gradient-to-r from-green-900/20 to-green-800/20',
          border: 'border-green-500/30 hover:border-green-500/50',
          text: 'text-green-400'
        };
    }
  };

  const getItemIcon = (item: Item) => {
    switch (item.type) {
      case 'revive':
        return '💫';
      case 'pp-restore':
        return '✨';
      case 'healing':
      default:
        return '💚';
    }
  };

  return (
    <motion.div
      className="w-full md:w-80 space-y-3"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-tekken-panel/95 backdrop-blur-xl border border-white/10 rounded-lg p-4 max-h-44 md:max-h-96 overflow-y-auto scrollbar-thin">
        {usableItems.length === 0 ? (
          <p className="text-gray-500 text-center font-rajdhani py-8">No items available</p>
        ) : (
          <div className="space-y-2">
            {usableItems.map((item) => {
              const style = getItemStyle(item);
              const icon = getItemIcon(item);
              
              return (
                <button
                  key={item.id}
                  className={clsx(
                    'w-full p-3 rounded-lg transition-all duration-200',
                    'border-2',
                    style.bg,
                    style.border,
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !disabled && onUseItem(item)}
                  disabled={disabled}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left flex items-start gap-2">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <div className="font-rajdhani text-white text-base font-semibold">
                          {item.name}
                        </div>
                        <div className="font-rajdhani text-xs text-gray-400 mt-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <div className={clsx(
                      'font-orbitron text-sm font-bold ml-4',
                      style.text
                    )}>
                      x{item.quantity}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <GlassButton
        variant="gray"
        className="w-full bg-tekken-dark/60"
        size="small"
        onClick={onBack}
      >
        ← Back
      </GlassButton>
    </motion.div>
  );
}