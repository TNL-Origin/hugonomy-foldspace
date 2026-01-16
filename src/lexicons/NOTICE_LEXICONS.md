# Lexicon Attribution and Provenance

**Last Updated**: December 23, 2025
**VibeAI Version**: v2.14.3+

---

## NRC Emotion Lexicon

This product includes or derives mappings from the **NRC Emotion Lexicon**.

### Citation

**Saif M. Mohammad and Peter D. Turney (2013).**
"Crowdsourcing a Word-Emotion Association Lexicon."
*Computational Intelligence*, 29(3): 436–465.

**Project page**: http://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm

### Usage Terms

Please follow the NRC lexicon terms of use as provided by the authors. The NRC Emotion Lexicon is available for research purposes.

### Implementation Notes

- **Integration Method**: VibeAI uses NRC labels as an **additive lexicon layer** (NOT a replacement)
- **Mapping**: NRC emotion labels are mapped to VibeAI tone categories via `nrc_mapping.json`
- **Feature Status**: Optional (disabled by default, feature-flagged)
- **Privacy**: All processing happens locally in the browser (no data transmission)

### NRC Emotion Labels

The NRC lexicon includes 8 basic emotions + 2 sentiment dimensions:

**Basic Emotions:**
- Anger
- Anticipation
- Disgust
- Fear
- Joy
- Sadness
- Surprise
- Trust

**Sentiment:**
- Positive
- Negative

### VibeAI Tone Mapping Strategy

See `nrc_mapping.json` for the current mapping configuration. Key design principles:

1. **Tension tones** (anger, fear, disgust, sadness) → VibeAI "Tension"
2. **Urgent tones** (surprise, anticipation) → VibeAI "Urgent" or "Reflective" (context-dependent)
3. **Aligned tones** (joy, trust, positive) → VibeAI "Aligned"
4. **Negative sentiment** → VibeAI "Tension" (light weight)

### Baseline Behavior

**IMPORTANT**: VibeAI's core lexicon remains the baseline. NRC is an **augmentation layer** that:
- Only activates when `EXPANDED_LEXICON_ENABLED = true`
- Adds to (not replaces) core tone detection
- Can be disabled without affecting baseline accuracy

---

## Core VibeAI Lexicon

**Source**: Proprietary, hand-curated by VibeAI team
**Location**: `vibeai-foldspace/src/data/toneMap_youth.json` and `toneMap_pro.json`
**Status**: Baseline (always active)

### Design Principles

1. **Privacy-first**: No external dependencies
2. **Explainable**: Each keyword has clear intent
3. **Dual-mode**: Student-Friendly vs Professional variants
4. **Conservative**: Small, high-confidence word sets

---

## Negation Handling

**Implementation**: Token-window negation detection (see `expandedLexicon.js`)

### Negation Tokens

Words that trigger negation windows:
- "not"
- "no"
- "never"
- "without"
- "neither"
- "nor"
- contractions ending in "n't" (can't, won't, isn't, etc.)

### Negation Window

- **Size**: 3 tokens after negation word
- **Effect**: Contributions from matched words reduced by `NEGATION_MULTIPLIER` (default: 0.25)
- **Example**:
  - "I am **frustrated**" → Tension +1.0
  - "I am **not frustrated**" → Tension +0.25 (reduced)

### Design Rationale

- **Conservative**: Reduces false positives without complex grammar parsing
- **Low risk**: Doesn't attempt "opposite emotion" flipping
- **Explainable**: Simple token-distance rule
- **Fast**: O(n) single-pass algorithm

---

## Future Enhancements (Post-Steven)

Potential improvements documented in `/docs/roadmap/HRI_IMPROVEMENTS_ROADMAP.md`:

1. **Weighted scoring** (context-dependent weights)
2. **Temporal patterns** (conversation arc detection)
3. **User preferences** (custom keyword sets)
4. **Dynamic thresholds** (ML-based calibration) - 2026 or later

---

## License Compliance

- **NRC Lexicon**: Subject to terms at http://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm
- **VibeAI Code**: Proprietary (see project LICENSE)
- **Extension Distribution**: Ensure NRC terms are followed if enabling expanded lexicon feature

---

**For questions about lexicon attribution, contact**: [Your legal/contact info]
