// lexicon-data.js
// VibeAI Coach V1 — Local-only lexicon data (mood tiles + prompt upgrade patterns)

(function () {
  window.VIBEAI_LEXICON = {
    moodTiles: [
      {
        id: 'calm',
        name: 'Calm',
        icon: '🌊',
        color: '#4A90E2',
        description: 'Measured, thoughtful prompts with clear intent',
        traits: ['Specific questions', 'Patient tone', 'Open to exploration']
      },
      {
        id: 'urgent',
        name: 'Urgent',
        icon: '⚡',
        color: '#F5A623',
        description: 'Time-sensitive needs requiring quick answers',
        traits: ['Action-oriented', 'Deadline-focused', 'Direct requests']
      },
      {
        id: 'reflective',
        name: 'Reflective',
        icon: '🤔',
        color: '#9013FE',
        description: 'Exploratory thinking and learning mindset',
        traits: ['What-if questions', 'Philosophical', 'Curious']
      },
      {
        id: 'dissonant',
        name: 'Dissonant',
        icon: '😞',
        color: '#D0021B',
        description: 'Frustration or confusion in communication',
        traits: ['Vague questions', 'Repeated attempts', 'Unclear goals']
      },
      {
        id: 'resonant',
        name: 'Resonant',
        icon: '✨',
        color: '#7ED321',
        description: 'Aligned and effective communication',
        traits: ['Clear context', 'Specific asks', 'Constructive tone']
      }
    ],

    promptUpgradePatterns: {
      urgency: {
        issue: 'Time pressure reduces clarity',
        template: 'I need [SPECIFIC OUTPUT] by [DEADLINE] for [CONTEXT]. Key constraints: [LIST].',
        example: 'I need a 3-paragraph summary of GDPR compliance by Friday for a board presentation. Key constraints: non-technical audience, focus on data retention rules.'
      },
      frustration: {
        issue: 'Emotional state clouds communication',
        template: 'Previous attempt: [WHAT DIDN\'T WORK]. Now trying: [NEW APPROACH]. Looking for: [SPECIFIC HELP].',
        example: 'Previous attempt: Asked for "Python help" and got generic tutorials. Now trying: specific debugging of asyncio timeout errors. Looking for: root cause analysis of why await() hangs.'
      },
      confusion: {
        issue: 'Unclear goals lead to unhelpful responses',
        template: 'Context: [SITUATION]. Goal: [DESIRED OUTCOME]. Tried: [PAST ATTEMPTS]. Question: [SPECIFIC ASK].',
        example: 'Context: Building a Chrome extension. Goal: Persist user settings across browser restarts. Tried: localStorage (gets cleared). Question: Should I use chrome.storage.sync instead?'
      },
      clarity: {
        issue: 'Even good prompts can improve',
        template: 'Task: [ACTION]. Format: [STRUCTURE]. Tone: [STYLE]. Constraints: [LIMITS].',
        example: 'Task: Write email to client about project delay. Format: 3 paragraphs (apology, explanation, next steps). Tone: Professional but warm. Constraints: Under 200 words, no technical jargon.'
      }
    },

    quickTips: [
      'Add context: "For a technical audience..." or "For my grandmother..."',
      'Specify format: "As a bullet list", "In table format", "Step-by-step"',
      'Set scope: "In 3 sentences", "Comprehensive overview", "Quick answer"',
      'Clarify intent: "To learn", "To fix a bug", "To explain to others"'
    ]
  };
})();
