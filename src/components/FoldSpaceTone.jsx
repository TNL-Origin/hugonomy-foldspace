import React, { useEffect, useState } from 'react';
import { motion as _motion } from 'framer-motion';
import toneMap from '../data/toneMap.json';
import { computeDriftedTone, clearDrift } from '../utils/toneDrift.js';

/**
 * FoldSpaceTone - Living Emotional Color Field with Drift Trail
 * Version: V.10.2-P2.5 "Drift Trail"
 *
 * Renders a full-screen gradient overlay that shifts organically
 * based on the drifted emotional tone (with 5s temporal memory).
 * Creates "breathing" transitions that hold emotional residue
 * before blending into new states.
 *
 * @param {number} avgTone - Average tone score from -1 (negative) to +1 (positive)
 */
export default function FoldSpaceTone({ avgTone }) {
  const [toneKey, setToneKey] = useState('reflective');
  const [driftedTone, setDriftedTone] = useState(0);

  // Compute drifted tone and map to qualitative category
  useEffect(() => {
    const drifted = computeDriftedTone(avgTone);
    setDriftedTone(drifted);

    // Map drifted numeric tone → qualitative category
    if (drifted > 0.6) {
      setToneKey('joy');
    } else if (drifted > 0.3) {
      setToneKey('calm');
    } else if (drifted < -0.6) {
      setToneKey('urgent');
    } else if (drifted < -0.3) {
      setToneKey('tense');
    } else if (Math.abs(drifted) <= 0.15) {
      setToneKey('serene'); // Near-zero: peaceful state
    } else if (drifted >= -0.3 && drifted <= 0.3) {
      setToneKey('reflective');
    }
  }, [avgTone]);

  // Reset drift on component unmount (tab change)
  useEffect(() => {
    return () => clearDrift();
  }, []);

  const tone = toneMap[toneKey] || toneMap.reflective;

  return (
    <motion.div
      key={toneKey} // Force re-mount on tone key change for smoother transitions
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        backgroundImage: tone.gradient
      }}
      transition={{
        duration: tone.motion.duration * 1.5, // Slower transitions for organic breathing
        ease: tone.motion.ease
      }}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{
        backdropFilter: 'blur(8px)',
        mixBlendMode: 'overlay',
        transition: 'background-image 1.5s ease-in-out' // Longer CSS transition for drift effect
      }}
      aria-hidden="true"
      data-tone-key={toneKey}
      data-avg-tone={avgTone?.toFixed(2)}
      data-drifted-tone={driftedTone?.toFixed(2)}
    />
  );
}
