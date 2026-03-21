/**
 * HugoScore Engine - VibeAI FoldSpace
 * Lexicon-based conversational tone and resonance analysis.
 *
 * Copyright (c) 2026 Joseph D. Tingling / Hugonomy Systems. All Rights Reserved.
 * Patent-pending: US Application No. 63/856,714
 *
 * This file is human-readable and verifiable per Chrome Web Store policy.
 * The algorithm is protected intellectual property. Use, reproduction, or
 * adaptation of this scoring logic without written permission is prohibited.
 */

const LEX = {
  p3: ['love','amazing','excellent','wonderful','brilliant','perfect','incredible','magnificent'],
  p2: ['great','good','happy','joy','pleased','nice','excited','delighted','grateful','appreciate'],
  p1: ['okay','fine','pleasant','decent','fair','thanks','calm','peace'],
  n3: ['hate','terrible','awful','worst','horrible','disgusting','furious','devastated','miserable'],
  n2: ['bad','angry','sad','upset','frustrated','annoyed','worried','disappointed','unhappy','fear'],
  n1: ['meh','blah','tired','bored','confused','concerned','unsure'],
  c1: ['suicide','kill','harm','hurt','hopeless','helpless','trapped','worthless'],
  c2: ['die','death','end','giving up','no point','want out'],
  neg: ['not','no','never','neither','nobody','nothing','hardly','barely',
        "don't","doesn't","didn't","won't","can't","isn't","aren't","wasn't","weren't"],
  reflect: ['think','perhaps','maybe','consider','wonder','might','could','possibly',
            'interesting','curious','question','suppose','imagine','believe','feel','seems'],
  boost: { very:1.5, extremely:2.0, incredibly:2.0, absolutely:1.8, really:1.3, quite:1.2, so:1.3, too:1.3, totally:1.5 },
  damp:  { slightly:0.7, somewhat:0.8, barely:0.5, hardly:0.5, almost:0.8 }
};

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}!?. ]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function determineMood(sentiment, arousal, coherence, resonance, rCount, crisis) {
  if (crisis === 'risk')                                                return 'urgent';
  if (arousal > 70)         return sentiment > 0                       ? 'resonant' : 'urgent';
  if (resonance > 50 && coherence > 60)                                return 'resonant';
  if (sentiment > 30  && coherence > 70  && arousal < 50)              return 'calm';
  if (sentiment < -30 && coherence < 50)                               return 'dissonant';
  if (rCount >= 2     || (arousal < 40   && Math.abs(sentiment) < 20)) return 'reflective';
  if (coherence < 50  && arousal < 40)                                 return 'dissonant';
  return 'reflective';
}

function calculateHSV(sentiment, arousal, coherence) {
  let h = sentiment > 0 ? 180 + sentiment * 0.6 : 200 + sentiment * 0.5;
  h = Math.max(0, Math.min(360, h));
  const s = Math.min(1, 0.3 + arousal / 200);
  const v = Math.min(1, 0.5 + coherence / 200);
  return [Math.round(h), Math.round(s * 100) / 100, Math.round(v * 100) / 100];
}

function createEmptyResult() {
  return {
    words: 0, sentiment: 0, coherence: 50,
    tone: 'neutral', mood: 'reflective',
    hri: 0.5, hugoScore: 50,
    valence: 0, arousal: 0, resonance: 0,
    hsv: [200, 0.3, 0.5],
    confidence: 0, crisis: 'safe', crisisConfidence: 0,
    flags: { shortText: true, longText: false, mixedEmotion: false, highArousal: false }
  };
}

export function analyzeText(text = '') {
  if (!text || text.trim().length === 0) return createEmptyResult();

  const raw    = text.trim();
  const words  = tokenize(raw);
  const wCount = words.length;
  const unique = new Set(words).size;

  let score = 0, pCount = 0, nCount = 0;
  let arousal = 0, rCount = 0;
  let c1Hits = 0, c2Match = false;
  let nextBoost = 1.0, negScope = 0;

  for (let i = 0; i < wCount; i++) {
    const w = words[i];
    if (LEX.neg.includes(w))     { negScope = 3; continue; }
    if (LEX.boost[w])            { nextBoost = LEX.boost[w]; continue; }
    if (LEX.damp[w])             { nextBoost = LEX.damp[w];  continue; }
    if (LEX.reflect.includes(w)) { rCount++; }
    if (LEX.c1.includes(w))      { c1Hits++; arousal += 2; }

    let wScore = 0, wArousal = 0;
    if      (LEX.p3.includes(w)) { wScore =  3; wArousal = 1.8; pCount++; }
    else if (LEX.p2.includes(w)) { wScore =  2; wArousal = 1.2; pCount++; }
    else if (LEX.p1.includes(w)) { wScore =  1; wArousal = 0.6; pCount++; }
    else if (LEX.n3.includes(w)) { wScore = -3; wArousal = 2.0; nCount++; }
    else if (LEX.n2.includes(w)) { wScore = -2; wArousal = 1.5; nCount++; }
    else if (LEX.n1.includes(w)) { wScore = -1; wArousal = 0.8; nCount++; }

    if (wScore !== 0) {
      wScore *= nextBoost;
      if (negScope > 0) { wScore *= -1; negScope--; }
      wScore   = Math.max(-4, Math.min(4, wScore));
      score   += wScore;
      arousal += wArousal * Math.abs(nextBoost);
      nextBoost = 1.0;
    }
    if (negScope > 0 && wScore === 0) negScope--;
  }

  const lower = raw.toLowerCase();
  if (LEX.c2.some(p => lower.includes(p))) { c2Match = true; arousal += 3; }

  const exclaim = (raw.match(/!/g) || []).length;
  const allCaps = (raw === raw.toUpperCase()) && wCount > 2;
  if (exclaim > 0) { score *= (1 + exclaim * 0.15); arousal += exclaim * 3; }
  if (allCaps)     { arousal += 15; }

  const sentiment   = Math.max(-100, Math.min(100, (score / Math.sqrt(wCount)) * 20));
  const diversity   = unique / wCount;
  const balance     = 1 - Math.abs(pCount - nCount) / Math.max(pCount + nCount, 1);
  const lengthBonus = (wCount > 5 && wCount < 150) ? 30 : 20;
  const coherence   = (diversity * 40) + (balance * 30) + lengthBonus;
  const resonance   = (pCount > 0 && nCount > 0)
    ? (Math.min(pCount, nCount) / Math.max(pCount, nCount)) * 100 : 0;

  arousal = Math.min(100, (arousal / wCount) * 30);

  let crisis = 'safe', crisisConfidence = 0;
  if      (c2Match && c1Hits >= 1)                            { crisis = 'risk';      crisisConfidence = 90; }
  else if (c1Hits >= 2)                                       { crisis = 'risk';      crisisConfidence = 85; }
  else if (c1Hits === 1 && (sentiment < -40 || arousal > 70)) { crisis = 'uncertain'; crisisConfidence = 60; }
  else if (c2Match)                                           { crisis = 'uncertain'; crisisConfidence = 55; }

  let confidence = 100;
  if (wCount < 3)              confidence *= 0.5;
  if (wCount > 150)            confidence *= 0.85;
  if (resonance > 60)          confidence *= 0.8;
  if (c2Match && c1Hits === 0) confidence *= 0.7;
  confidence = Math.round(confidence);

  const sentimentNorm  = (sentiment + 100) / 200;
  const coherenceNorm  = coherence / 100;
  const arousalPenalty = arousal > 70 ? (100 - arousal) / 100 : 1;
  let hri = (sentimentNorm * 0.4) + (coherenceNorm * 0.4) + (arousalPenalty * 0.2);
  if      (crisis === 'risk')      hri *= 0.3;
  else if (crisis === 'uncertain') hri *= 0.7;
  hri = Math.max(0, Math.min(1, hri));

  const tone = sentiment > 15 ? 'positive' : sentiment < -15 ? 'negative' : 'neutral';
  const mood = determineMood(sentiment, arousal, coherence, resonance, rCount, crisis);

  return {
    words: wCount, sentiment: Math.round(sentiment), coherence: Math.round(coherence),
    tone, mood, hri, hugoScore: Math.round(hri * 100),
    valence: Math.round(sentiment), arousal: Math.round(arousal), resonance: Math.round(resonance),
    hsv: calculateHSV(sentiment, arousal, coherence),
    confidence, crisis, crisisConfidence,
    flags: {
      shortText: wCount < 3, longText: wCount > 150,
      mixedEmotion: resonance > 60, highArousal: arousal > 70
    }
  };
}
