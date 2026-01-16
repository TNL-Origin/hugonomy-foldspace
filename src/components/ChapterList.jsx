import React from 'react';
import { motion as _motion } from 'framer-motion';

/**
 * ChapterList - Placeholder Chapter Display
 * Version: V.10.3-P1 "Sidebar Genesis"
 *
 * Displays static placeholder chapters until Chamlin implements detection logic.
 * Future: Will show detected conversation chapters with tone transitions.
 *
 * @param {Array} chapters - Chapter data (currently placeholder)
 * @param {string} currentTone - Current tone key for styling
 */
export default function ChapterList({ chapters = [] }) {
  // Placeholder data
  const placeholderChapters = [
    { id: 1, title: 'Intro', range: '1–5', tone: 'calm' },
    { id: 2, title: 'Tech Discussion', range: '6–20', tone: 'reflective' }
  ];

  const displayChapters = chapters.length > 0 ? chapters : placeholderChapters;

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      className="vibeai-chapter-list"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="chapter-header">
        <span className="chapter-icon">📖</span>
        <h3 className="chapter-title">Conversation Chapters</h3>
      </div>

      <ul className="chapter-items">
        {displayChapters.map((chapter) => (
          <motion.li
            key={chapter.id}
            className="chapter-item"
            variants={itemVariants}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
          >
            <span className="chapter-bullet">•</span>
            <span className="chapter-name">{chapter.title}</span>
            <span className="chapter-range">({chapter.range})</span>
          </motion.li>
        ))}
      </ul>

      <div className="chapter-footer">
        <span className="chapter-note">Chapter detection coming soon</span>
      </div>
    </motion.div>
  );
}
