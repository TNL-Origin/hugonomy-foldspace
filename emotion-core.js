// === VibeAI HugoScore Engine v1.0 (Phase III-C) ===
// Emotional tone analysis for thread content

/**
 * Analyzes text content and returns emotional tone metadata
 * @param {string} text - The text content to analyze
 * @returns {object} Tone analysis results with hugoScore, hue, drift, and resonance
 */
export function analyzeTone(text) {
  const clean = text.toLowerCase();
  let tone = "calm", hue = "#00d4ff", hugoScore = 60, driftIndex = 0.3;

  // Emotional keyword dictionaries
  const positive = ["love", "peace", "good", "thank", "beautiful", "hope", "great", "wonderful", "amazing", "perfect", "happy", "joy"];
  const negative = ["angry", "hate", "bad", "tired", "sad", "broken", "fail", "error", "wrong", "terrible", "awful", "disaster"];
  const tense = ["urgent", "deadline", "fix", "crash", "problem", "stress", "issue", "bug", "critical", "emergency", "asap", "help"];

  // Tone classification with scoring
  if (positive.some(w => clean.includes(w))) {
    tone = "resonant";
    hugoScore = 85;
    hue = "#7bff6a"; // Green - positive resonance
    driftIndex = 0.1;
  } else if (negative.some(w => clean.includes(w))) {
    tone = "drift";
    hugoScore = 35;
    hue = "#ffcc00"; // Yellow - emotional drift
    driftIndex = 0.7;
  } else if (tense.some(w => clean.includes(w))) {
    tone = "tense";
    hugoScore = 50;
    hue = "#ff4f4f"; // Red - tension/urgency
    driftIndex = 0.5;
  }

  // Calculate resonance level
  const resonanceLevel = hugoScore > 70 ? "high" : hugoScore > 50 ? "medium" : "low";

  void 0;

  return { tone, hugoScore, hue, driftIndex, resonanceLevel };
}

/**
 * Analyzes batch of threads and returns aggregate statistics
 * @param {array} threads - Array of thread objects with content
 * @returns {object} Aggregate tone statistics
 */
export function analyzeThreadBatch(threads) {
  if (!threads || threads.length === 0) {
    return { averageScore: 60, dominantTone: "calm", totalThreads: 0 };
  }

  const analyses = threads.map(t => analyzeTone(t.content || t.preview || ""));
  const averageScore = analyses.reduce((sum, a) => sum + a.hugoScore, 0) / analyses.length;

  // Count tone frequencies
  const toneCounts = {};
  analyses.forEach(a => {
    toneCounts[a.tone] = (toneCounts[a.tone] || 0) + 1;
  });

  const dominantTone = Object.keys(toneCounts).reduce((a, b) =>
    toneCounts[a] > toneCounts[b] ? a : b
  );

  return {
    averageScore: Math.round(averageScore),
    dominantTone,
    totalThreads: threads.length,
    toneDistribution: toneCounts
  };
}
