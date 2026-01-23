import { motion } from 'framer-motion';
import { Pokeball } from './Pokeball';

export function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-4'>
      <Pokeball size='small' position='relative' animation='animate-spin' />
      
      {message && (
        <motion.p
          className='font-rajdhani text-gray-400'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}