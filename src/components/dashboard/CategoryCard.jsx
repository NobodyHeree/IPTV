import React from 'react';
import { motion } from 'framer-motion';

const CategoryCard = ({ category, onClick }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card p-6 cursor-pointer group"
    >
        <h3 className="font-semibold text-base truncate group-hover:text-[var(--color-accent)] transition-colors">
            {category.displayName}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Catégorie</p>
    </motion.div>
);

export default CategoryCard;
