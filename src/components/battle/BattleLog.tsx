import { AnimatePresence, motion } from "framer-motion";

interface BattleLogProps {
	showMessage: boolean;
	message: string;
}

export function BattleLog({ showMessage, message}: BattleLogProps) {
	return (
		<AnimatePresence>
			{showMessage && (
				<motion.div
					className="z-20 absolute bottom-2 left-2 right-2 md:w-full md:h-1/4 md:bottom-0 md:left-0 md:right-0 md:p-4"
					initial={{ y: 30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 30, opacity: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="flex items-center justify-center bg-tekken-panel/85 backdrop-blur-xl border-2 border-slate-100/20 rounded-lg md:h-full p-3 md:p-4">
						<p className="font-rajdhani text-slate-100 text-sm md:text-2xl">
							{message}
						</p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}