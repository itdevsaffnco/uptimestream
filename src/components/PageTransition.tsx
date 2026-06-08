import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import type { Variants } from "framer-motion";

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function PageTransition({ children, pageKey }: { children: ReactNode; pageKey?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease },
  },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease },
  },
};
