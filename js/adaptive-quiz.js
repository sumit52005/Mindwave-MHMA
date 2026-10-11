/**
 * Adaptive Clinical Questioning Engine
 * Mindwave Mental Health Management Application (MHMA)
 * Dynamically selects follow-up questions (up to 10) based on contextual user responses
 * and synthesizes multidimensional Situation Analysis & Step-by-Step Relief Plan.
 */

(function () {
  // Comprehensive Clinical Question Bank categorized by Domain
  // Each question provides 4 calibrated intensity levels (0=Minimal/None, 1=Mild, 2=Moderate, 3=Severe)
  // and maps to core PHQ feature dimensions (q1..q8)
  const QUESTION_BANK = {
    // ── INITIAL SCREENING QUESTION POOL (Randomized opening variants) ──
    screening: [
      {
        id: "screen_overview",
        domain: "General Emotional State",
        dimension: "q2",
        text: "Over the past several days, how would you describe your overall mood and emotional balance?",
        contextNote: "Initial wellness screening to calibrate your assessment path",
        options: [
          { text: "Stable, calm, and generally positive", score: 0, tag: "positive" },
          { text: "Mildly stressed, uneasy, or slightly low at times", score: 1, tag: "mild_strain" },
          { text: "Consistently overwhelmed, down, or emotionally strained", score: 2, tag: "moderate_strain" },
          { text: "Severely exhausted, deeply distressed, or struggling daily", score: 3, tag: "severe_strain" }
        ]
      },
      {
        id: "screen_vitality",
        domain: "General Emotional State",
        dimension: "q1",
        text: "Thinking about the past week, how has your overall sense of enthusiasm, motivation, and mental energy felt?",
        contextNote: "Initial vitality screening to calibrate your assessment path",
        options: [
          { text: "Energetic and motivated for daily activities", score: 0, tag: "positive" },
          { text: "A bit dull or lacking motivation at times, but manageable", score: 1, tag: "mild_strain" },
          { text: "Noticeable loss of interest, feeling drained or numb", score: 2, tag: "moderate_strain" },
          { text: "Extremely difficult to care about or enjoy anything", score: 3, tag: "severe_strain" }
        ]
      }
    ],

    // ── ANXIETY & NERVOUS TENSION (q3) ──
    anxiety: [
      {
        id: "anx_nervous",
        domain: "Anxiety & Tension",
        dimension: "q3",
        text: "How often have you felt on edge, nervous, or unable to stop worrying?",
        contextNote: "Exploring anxiety and nervous system activation",
        options: [
          { text: "Rarely or not at all", score: 0 },
          { text: "Occasionally during stressful moments", score: 1 },
          { text: "Frequently, lingering through most of the day", score: 2 },
          { text: "Almost constantly, feeling paralyzed by anxiety", score: 3 }
        ]
      },
      {
        id: "anx_racing_thoughts",
        domain: "Cognitive Tension",
        dimension: "q3",
        text: "When you feel stressed or unsettled, do your thoughts race with worst-case scenarios or overthinking?",
        contextNote: "Follow-up based on your report of mental tension",
        options: [
          { text: "No, my mind stays relatively calm", score: 0 },
          { text: "Mild overthinking, but I can distract myself", score: 1 },
          { text: "Frequent racing thoughts that are hard to quiet", score: 2 },
          { text: "Intense rumination that spirals out of control", score: 3 }
        ]
      },
      {
        id: "anx_physical_panic",
        domain: "Somatic Anxiety",
        dimension: "q3",
        text: "Have you noticed physical symptoms of anxiety like rapid heartbeat, tight chest, shallow breathing, or trembling?",
        contextNote: "Evaluating physiological and autonomic stress response",
        options: [
          { text: "None of these physical symptoms", score: 0 },
          { text: "Mild muscle tightness or subtle flutter", score: 1 },
          { text: "Noticeable rapid heartbeat, shallow breathing, or stomach knots", score: 2 },
          { text: "Frequent panic sensations or acute physical distress", score: 3 }
        ]
      }
    ],

    // ── DEPRESSIVE AFFECT & SADNESS (q2) ──
    depression: [
      {
        id: "dep_hopeless",
        domain: "Depressive Affect",
        dimension: "q2",
        text: "How often have you felt down, blue, or experienced feelings of hopelessness about your circumstances?",
        contextNote: "Probing mood depth and emotional outlook",
        options: [
          { text: "Not at all, I feel hopeful", score: 0 },
          { text: "Several brief periods of sadness", score: 1 },
          { text: "More than half the time, feeling heavy-hearted", score: 2 },
          { text: "Nearly every day, feeling empty or deeply pessimistic", score: 3 }
        ]
      },
      {
        id: "dep_self_worth",
        domain: "Self-Perception & Guilt",
        dimension: "q2",
        text: "Have you been experiencing harsh self-criticism, feeling like a failure, or letting yourself down?",
        contextNote: "Contextual check on internal dialogue and self-esteem",
        options: [
          { text: "Not at all, I treat myself with kindness", score: 0 },
          { text: "Occasionally when things go wrong", score: 1 },
          { text: "Often feeling inadequate or guilty", score: 2 },
          { text: "Persistent, overwhelming self-blame and worthlessness", score: 3 }
        ]
      }
    ],

    // ── INTEREST & PLEASURE / ANHEDONIA (q1) ──
    anhedonia: [
      {
        id: "anh_enjoyment",
        domain: "Pleasure & Enjoyment",
        dimension: "q1",
        text: "How much joy, laughter, or satisfaction are you able to draw from your usual hobbies, music, or friends?",
        contextNote: "Examining anhedonia and capacity for pleasure",
        options: [
          { text: "Normal enjoyment, hobbies feel rewarding", score: 0 },
          { text: "Slightly diminished, things feel a little bland", score: 1 },
          { text: "Significantly reduced, doing things on autopilot", score: 2 },
          { text: "Completely unable to feel pleasure or satisfaction", score: 3 }
        ]
      },
      {
        id: "anh_anticipation",
        domain: "Motivation & Drive",
        dimension: "q1",
        text: "Do you look forward to upcoming plans, or does facing tomorrow feel like a heavy chore?",
        contextNote: "Follow-up evaluating forward-looking motivation",
        options: [
          { text: "I look forward to upcoming activities", score: 0 },
          { text: "Mostly fine, with occasional reluctance", score: 1 },
          { text: "Often dreading the day or lacking any anticipation", score: 2 },
          { text: "Every single day feels like an exhausting burden", score: 3 }
        ]
      }
    ],

    // ── SLEEP ARCHITECTURE (q4) ──
    sleep: [
      {
        id: "slp_quality",
        domain: "Sleep Quality",
        dimension: "q4",
        text: "How has your sleep quality been (trouble falling asleep, waking up in the middle of the night, or sleeping too much)?",
        contextNote: "Assessing circadian rhythm and sleep architecture",
        options: [
          { text: "Deep, restful sleep (7-8 hours consistently)", score: 0 },
          { text: "Mild sleep delay or waking up restless occasionally", score: 1 },
          { text: "Frequent insomnia, early morning awakenings, or hypersomnia", score: 2 },
          { text: "Severe chronic sleep disruption; never feeling rested", score: 3 }
        ]
      },
      {
        id: "slp_bedtime_mind",
        domain: "Nighttime Restlessness",
        dimension: "q4",
        text: "When you try to sleep at night, does your mind stay hyperactive or do you wake up feeling drained?",
        contextNote: "Follow-up linking emotional strain with sleep latency",
        options: [
          { text: "My mind shuts down easily at bedtime", score: 0 },
          { text: "Takes 20-30 minutes to unwind occasionally", score: 1 },
          { text: "Tossing and turning with a hyperactive mind for hours", score: 2 },
          { text: "Exhausted but unable to stay asleep; waking in distress", score: 3 }
        ]
      }
    ],

    // ── ENERGY & FATIGUE (q5) ──
    energy: [
      {
        id: "eng_fatigue",
        domain: "Energy & Vitality",
        dimension: "q5",
        text: "How would you rate your physical energy and stamina during typical daytime hours?",
        contextNote: "Assessing somatic exhaustion and burnout levels",
        options: [
          { text: "Steady and vibrant energy throughout the day", score: 0 },
          { text: "Occasional afternoon slumps, but manageable", score: 1 },
          { text: "Persistent fatigue; feeling like running on low battery", score: 2 },
          { text: "Severe chronic exhaustion; even basic tasks feel heavy", score: 3 }
        ]
      },
      {
        id: "eng_burnout",
        domain: "Burnout & Depletion",
        dimension: "q5",
        text: "Do you feel emotionally drained by daily responsibilities like work, studies, or domestic routines?",
        contextNote: "Follow-up evaluating burnout and reserve capacity",
        options: [
          { text: "No, I have healthy capacity and reserves", score: 0 },
          { text: "Slightly drained by evening, but recharge overnight", score: 1 },
          { text: "Feeling depleted; struggling to keep up with daily tasks", score: 2 },
          { text: "Complete emotional burnout and somatic collapse", score: 3 }
        ]
      }
    ],

    // ── COGNITIVE FOCUS & MENTAL CLARITY (q6) ──
    cognition: [
      {
        id: "cog_focus",
        domain: "Cognitive Focus",
        dimension: "q6",
        text: "How difficult has it been to maintain concentration on reading, working, or making routine decisions?",
        contextNote: "Evaluating cognitive bandwidth, focus, and brain fog",
        options: [
          { text: "Clear focus, decisions feel straightforward", score: 0 },
          { text: "Mild distraction or occasional daydreaming", score: 1 },
          { text: "Frequent brain fog, procrastination, or loss of focus", score: 2 },
          { text: "Severe cognitive paralysis; unable to concentrate or decide", score: 3 }
        ]
      }
    ],

    // ── PSYCHOMOTOR BALANCE & RESTLESSNESS (q7) ──
    psychomotor: [
      {
        id: "psy_restless",
        domain: "Psychomotor Balance",
        dimension: "q7",
        text: "Have you felt physically fidgety, restless, and unable to sit still, or conversely, slowed down and sluggish?",
        contextNote: "Assessing psychomotor agitation or retardation",
        options: [
          { text: "Balanced physical pace, relaxed posture", score: 0 },
          { text: "Slight fidgeting or occasional pacing when stressed", score: 1 },
          { text: "Noticeable physical restlessness or sluggish heaviness", score: 2 },
          { text: "Extreme agitation or severe psychomotor slowdown", score: 3 }
        ]
      }
    ],

    // ── SOCIAL CONNECTION & SUPPORT (Contextual / q2/q3 modifier) ──
    social: [
      {
        id: "soc_connection",
        domain: "Social & Interpersonal",
        dimension: "q2",
        text: "Have you felt like pulling away from friends, isolating yourself, or feeling lonely even around others?",
        contextNote: "Evaluating social isolation and interpersonal buffering",
        options: [
          { text: "Feel well connected and comfortable socializing", score: 0 },
          { text: "Occasionally wanting space, but still connected", score: 1 },
          { text: "Frequently canceling plans, withdrawing into isolation", score: 2 },
          { text: "Completely isolated, feeling profoundly lonely or detached", score: 3 }
        ]
      }
    ],

    // ── COPING CAPACITY & DAILY RESILIENCE (Contextual / q1/q3 modifier) ──
    coping: [
      {
        id: "cop_resilience",
        domain: "Stress Resilience",
        dimension: "q3",
        text: "When an unexpected challenge occurs, how confident do you feel in your ability to cope and bounce back?",
        contextNote: "Examining psychological resilience and coping resources",
        options: [
          { text: "Very confident; I handle unexpected bumps smoothly", score: 0 },
          { text: "Mildly rattled at first, but adapt after a short time", score: 1 },
          { text: "Easily thrown off balance; small setbacks feel magnified", score: 2 },
          { text: "Feel unable to cope; even minor issues feel catastrophic", score: 3 }
        ]
      }
    ],

    // ── CRISIS & DISTRESS SCREENING (q8) ──
    crisis: [
      {
        id: "cri_distress",
        domain: "Distress & Safety",
        dimension: "q8",
        text: "In the past two weeks, have you had thoughts that you would be better off asleep forever or thoughts of self-harm?",
        contextNote: "Standard clinical safety screening for wellness support",
        options: [
          { text: "Not at all (0)", score: 0 },
          { text: "Fleeting thought on several days, but dismissed (1)", score: 1 },
          { text: "More than half the days (2)", score: 2 },
          { text: "Nearly every day, with significant distress (3)", score: 3 }
        ]
      }
    ]
  };

  /**
   * Adaptive Question Selector
   * Picks the next optimal question based on history (up to 10 questions total)
   */
  function getNextAdaptiveQuestion(history) {
    const count = history.length;
    if (count >= 10) return null; // Reached max 10 questions

    const answeredIds = new Set(history.map(h => h.question.id));
    const lastEntry = count > 0 ? history[count - 1] : null;

    // First question: pick from screening pool
    if (count === 0) {
      const idx = Math.floor(Math.random() * QUESTION_BANK.screening.length);
      return QUESTION_BANK.screening[idx];
    }

    // Calculate domain scores accumulated so far
    const domainScores = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0 };
    history.forEach(h => {
      const dim = h.question.dimension;
      if (domainScores[dim] !== undefined) {
        domainScores[dim] = Math.max(domainScores[dim], h.selectedOption.score);
      }
    });

    const lastScore = lastEntry.selectedOption.score;
    const lastDim = lastEntry.question.dimension;

    // Helper: find first unasked question from a list
    const findUnasked = (list) => list.find(q => !answeredIds.has(q.id));

    // Dynamic Contextual Decision Logic
    // Step 2-3: Branch based on initial answers
    if (count === 1) {
      if (lastScore >= 2) {
        // High strain reported initially -> probe deeper into Anxiety or Depressive affect
        const candidate = findUnasked(QUESTION_BANK.anxiety) || findUnasked(QUESTION_BANK.depression);
        if (candidate) {
          candidate.contextNote = "Following up on your feeling of strain: let's explore your anxiety and mental tension.";
          return candidate;
        }
      } else if (lastScore === 1) {
        // Mild strain -> probe Sleep or Energy
        const candidate = findUnasked(QUESTION_BANK.sleep) || findUnasked(QUESTION_BANK.anxiety);
        if (candidate) {
          candidate.contextNote = "Noted some mild unease: let's see how this is affecting your sleep and recovery.";
          return candidate;
        }
      } else {
        // Positive state -> probe Vitality / Sleep / Focus resilience
        const candidate = findUnasked(QUESTION_BANK.anhedonia) || findUnasked(QUESTION_BANK.sleep);
        if (candidate) {
          candidate.contextNote = "Great to hear your mood is balanced: let's look at your daily joy and interest levels.";
          return candidate;
        }
      }
    }

    // Step 4-6: Target unexplored primary dimensions (Sleep, Energy, Cognition)
    if (!answeredIds.has('slp_quality') && !answeredIds.has('slp_bedtime_mind')) {
      const q = findUnasked(QUESTION_BANK.sleep);
      if (q) {
        q.contextNote = "Examining sleep architecture and rest quality in the context of your daily rhythm.";
        return q;
      }
    }

    if (!answeredIds.has('eng_fatigue') && !answeredIds.has('eng_burnout')) {
      const q = findUnasked(QUESTION_BANK.energy);
      if (q) {
        q.contextNote = lastScore >= 2
          ? "Given the fatigue you indicated, how are your daytime stamina and reserve energy?"
          : "Checking in on daytime energy and vitality levels.";
        return q;
      }
    }

    if (!answeredIds.has('cog_focus')) {
      const q = findUnasked(QUESTION_BANK.cognition);
      if (q) {
        q.contextNote = "Let's assess mental clarity, focus, and concentration during your daily tasks.";
        return q;
      }
    }

    // Step 7-8: Check Social isolation or Coping Resilience
    if (!answeredIds.has('anh_enjoyment') && !answeredIds.has('anh_anticipation')) {
      const q = findUnasked(QUESTION_BANK.anhedonia);
      if (q) {
        q.contextNote = "Exploring your capacity for pleasure, hobbies, and emotional reward.";
        return q;
      }
    }

    if (!answeredIds.has('psy_restless')) {
      const q = findUnasked(QUESTION_BANK.psychomotor);
      if (q) {
        q.contextNote = "Checking for physical signs of tension, fidgetiness, or sluggishness.";
        return q;
      }
    }

    if (!answeredIds.has('soc_connection') && (domainScores.q2 >= 1 || domainScores.q3 >= 1)) {
      const q = findUnasked(QUESTION_BANK.social);
      if (q) {
        q.contextNote = "Understanding your interpersonal support system and desire for connection.";
        return q;
      }
    }

    if (!answeredIds.has('cop_resilience')) {
      const q = findUnasked(QUESTION_BANK.coping);
      if (q) {
        q.contextNote = "Evaluating how you navigate unexpected hurdles and daily stressors.";
        return q;
      }
    }

    // Question 9 or 10: Always include standard clinical safety/distress screening if not yet asked
    if (!answeredIds.has('cri_distress') && (count >= 8 || domainScores.q2 >= 2 || domainScores.q3 >= 2)) {
      const q = findUnasked(QUESTION_BANK.crisis);
      if (q) {
        q.contextNote = "Final clinical safety screening to provide comprehensive, responsible guidance.";
        return q;
      }
    }

    // Fallback: pick any unasked question from remaining pools
    const allPools = [
      ...QUESTION_BANK.anxiety,
      ...QUESTION_BANK.depression,
      ...QUESTION_BANK.anhedonia,
      ...QUESTION_BANK.sleep,
      ...QUESTION_BANK.energy,
      ...QUESTION_BANK.cognition,
      ...QUESTION_BANK.psychomotor,
      ...QUESTION_BANK.social,
      ...QUESTION_BANK.coping,
      ...QUESTION_BANK.crisis
    ];

    const fallback = allPools.find(q => !answeredIds.has(q.id));
    if (fallback) {
      fallback.contextNote = "Deepening contextual analysis across your mental health profile.";
      return fallback;
    }

    return null; // Exhausted questions (should not happen with >15 pool items)
  }

  /**
   * Aggregate dynamic answers into 8 standardized PHQ features (q1..q8)
   * used by the Random Forest model.
   */
  function aggregateAnswersToRF(history) {
    const scoresByDim = {
      q1: [], q2: [], q3: [], q4: [], q5: [], q6: [], q7: [], q8: []
    };

    history.forEach(item => {
      const dim = item.question.dimension;
      const score = item.selectedOption.score;
      if (scoresByDim[dim]) {
        scoresByDim[dim].push(score);
      }
    });

    const standardizedAnswers = {};
    for (let i = 1; i <= 8; i++) {
      const key = `q${i}`;
      const list = scoresByDim[key];
      if (list && list.length > 0) {
        // If multiple questions asked in this domain, calculate calibrated max/weighted score
        const maxScore = Math.max(...list);
        const avgScore = list.reduce((a, b) => a + b, 0) / list.length;
        // Conservative clinical weighting: 70% max, 30% avg, clamped 0..3
        standardizedAnswers[key] = Math.min(3, Math.max(0, Math.round(maxScore * 0.7 + avgScore * 0.3)));
      } else {
        // If domain wasn't triggered because user had minimal symptoms, default to 0
        standardizedAnswers[key] = 0;
      }
    }

    return standardizedAnswers;
  }

  /**
   * Synthesize in-depth Situation Analysis based on user's trajectory
   */
  function generateSituationAnalysis(history, mlResult) {
    const { prediction, confidence, subscales, topDrivers } = mlResult;
    const answeredScores = history.map(h => ({
      domain: h.question.domain,
      dim: h.question.dimension,
      score: h.selectedOption.score,
      label: h.selectedOption.text
    }));

    const maxScore = Math.max(...answeredScores.map(s => s.score));
    const highDomains = answeredScores.filter(s => s.score >= 2).map(s => s.domain);

    let patternTitle = "";
    let physiologicalMechanism = "";
    let cognitivePattern = "";
    let severitySummary = "";

    if (prediction === "Good") {
      patternTitle = "Psychologically Stable & Resilient State";
      severitySummary = "Your adaptive screening reveals a well-balanced emotional baseline with robust recovery mechanisms and minimal somatic distress.";
      physiologicalMechanism = "Your autonomic nervous system appears well-regulated with balanced parasympathetic vagal tone, allowing for healthy sleep restorative cycles and sustained cognitive focus.";
      cognitivePattern = "Thought patterns indicate adaptive cognitive appraisal, healthy stress tolerance, and emotional openness to daily activities.";
    } else if (prediction === "Mild") {
      patternTitle = "Situational Stress & Mild Mood Fluctuation";
      severitySummary = `Mild emotional friction detected, primarily characterized by occasional ${highDomains.length > 0 ? highDomains.join(' and ') : 'daily stressors and energy dips'}.`;
      physiologicalMechanism = "Experiencing periodic sympathetic nervous system activation (elevated cortisol, mild sleep delay, or muscle tightness), but biological reserves remain largely intact.";
      cognitivePattern = "Occasional intrusive worry loops or fatigue, but self-awareness and capacity for enjoyment remain accessible.";
    } else if (prediction === "Moderate") {
      patternTitle = "Substantial Emotional Strain & Energy Depletion";
      severitySummary = `Noticeable distress pattern involving multiple interconnected dimensions: ${highDomains.join(', ') || 'anxiety, fatigue, and low mood'}.`;
      physiologicalMechanism = "Signs of sustained sympathetic overdrive or HPA-axis (hypothalamic-pituitary-adrenal) fatigue. Sleep architecture and physical recovery are likely fragmented, creating daytime lethargy and restlessness.";
      cognitivePattern = "Elevated cognitive fog, rumination, or avoidance behaviors. Everyday tasks feel heavier than normal, and emotional bandwidth is constrained.";
    } else {
      patternTitle = "Severe Distress & High Priority Crisis Burden";
      severitySummary = `High clinical concern across core domains (${highDomains.join(', ') || 'mood, anxiety, sleep, and coping capacity'}). Functional impairment is evident.`;
      physiologicalMechanism = "Significant neurochemical and physiological exhaustion. Chronically elevated stress response combined with severe sleep or somatic depletion, impairing normal emotional regulation.";
      cognitivePattern = "Pervasive helplessness, intense racing thoughts or emotional numbness, harsh self-blame, or crisis vulnerability. Urgent relief measures are essential.";
    }

    return {
      patternTitle,
      severitySummary,
      physiologicalMechanism,
      cognitivePattern,
      highDomains,
      totalQuestionsAsked: history.length,
      topDrivers: topDrivers || []
    };
  }

  /**
   * Synthesize Step-by-Step Relief Plan tailored to the user's situation
   */
  function generateStepByStepReliefPlan(mlResult, situationAnalysis) {
    const { prediction, topDrivers, subscales } = mlResult;

    // Phase 1: Acute / Immediate Relief (Right Now - Next 2 Hours)
    const acuteSteps = [];
    if (prediction === "High" || (subscales && subscales.criticalFlag)) {
      acuteSteps.push({
        num: 1,
        title: "Immediate Safety & Sensory Grounding (5-4-3-2-1 Reset)",
        tag: "Immediate (5 mins)",
        description: "Engage your physical senses to halt emotional overwhelm: Name 5 things you can see, 4 you can physically touch, 3 sounds you hear, 2 scents you notice, and 1 taste. This pulls your brain out of the amygdala loop back into sensory reality."
      });
      acuteSteps.push({
        num: 2,
        title: "Cold Water Vagal Reset (Mammalian Dive Reflex)",
        tag: "Immediate (2 mins)",
        description: "Splash cold water onto your eyes and cheekbones or hold an ice cube in your palm for 60 seconds. This immediately triggers the vagus nerve to slow your heart rate and down-regulate panic."
      });
      acuteSteps.push({
        num: 3,
        title: "Contact Trusted Support or Verified Helpline",
        tag: "Urgent (Within 1 hour)",
        description: "Do not navigate severe distress in isolation. Call a trusted family member, close friend, or connect with a free, confidential mental health helpline (Tele-MANAS: 14416 | KIRAN: 1800-599-0019 | AASRA: 91-9820466726)."
      });
    } else if (prediction === "Moderate") {
      acuteSteps.push({
        num: 1,
        title: "The Physiological Sigh Breathing (Parasympathetic Reset)",
        tag: "Immediate (3 mins)",
        description: "Take two consecutive deep inhales through your nose (first full, second a quick top-off), followed by a slow, unforced exhale through your mouth. Repeat 5 times to immediately expel excess CO2 and activate your parasympathetic nervous system."
      });
      acuteSteps.push({
        num: 2,
        title: "Mental Release: 10-Minute Worry Download",
        tag: "Next 30 mins",
        description: "Grab a physical piece of paper and write down every unfinished task, worry, or tension currently crowding your mind without filtering. Once written, close the notebook to signal to your brain that the thoughts are secured."
      });
      acuteSteps.push({
        num: 3,
        title: "Physical Environment & Screen Pause",
        tag: "Next 1 hour",
        description: "Step away from all screens, dim bright overhead lights, and take a 15-minute quiet walk or lay down with feet elevated to relieve physical tension."
      });
    } else {
      // Good or Mild
      acuteSteps.push({
        num: 1,
        title: "Box Breathing for Calming Equilibrium",
        tag: "Immediate (4 mins)",
        description: "Inhale for 4 counts, hold for 4 counts, exhale for 4 counts, and hold empty for 4 counts. Practice for 3-5 cycles to maintain mental clarity and autonomic balance."
      });
      acuteSteps.push({
        num: 2,
        title: "Postural & Hydration Check",
        tag: "Next 15 mins",
        description: "Drink a large glass of water, gently stretch your neck and shoulders, and step outdoors for fresh air to sustain natural vitality."
      });
    }

    // Phase 2: Short-Term Stabilization (Next 24 to 48 Hours)
    const shortTermSteps = [
      {
        num: 4,
        title: "Circadian Sleep Architecture Reset",
        tag: "Day 1 - Evening",
        description: "Lock in a fixed bedtime. Stop screen exposure 60 minutes before bed, keep the room cool (around 19-21°C), and avoid caffeine after 2:00 PM to protect REM and slow-wave deep sleep."
      },
      {
        num: 5,
        title: "Morning Sunlight & Movement Anchor",
        tag: "Day 2 - Morning",
        description: "Step into direct natural morning light within 30 minutes of waking for 10-15 minutes. This sets your cortisol peak early in the day and programs your melatonin release for nighttime sleep."
      },
      {
        num: 6,
        title: "Micro-Tasking & Energy Conservation",
        tag: "Day 2 - Daytime",
        description: "Break your day's responsibilities into manageable 15-minute micro-intervals. Decline or postpone non-urgent commitments to protect your mental energy bandwidth."
      }
    ];

    // Phase 3: Medium-Term Recovery & Behavioral Activation (Next 1 to 2 Weeks)
    const mediumTermSteps = [
      {
        num: 7,
        title: "Cognitive Reframing (Catching Thinking Traps)",
        tag: "Week 1",
        description: "When you notice catastrophic thoughts ('everything is going wrong'), pause and write down the objective evidence for and against that thought. Identify a balanced, realistic alternative statement."
      },
      {
        num: 8,
        title: "Joy Scheduling & Low-Friction Hobbies",
        tag: "Week 1 - 2",
        description: "Schedule at least one low-effort, enjoyable activity every single day (e.g., listening to an acoustic album, tending a plant, brewing tea, gentle sketching) regardless of whether you feel motivated beforehand."
      },
      {
        num: 9,
        title: "Supportive Social Touchpoint",
        tag: "Week 2",
        description: "Share how you have been feeling with one empathetic person. Human connection releases oxytocin and buffers the cardiovascular effects of sustained stress."
      }
    ];

    // Phase 4: Long-Term Protocol & Professional Guidance
    const longTermSteps = [
      {
        num: 10,
        title: "Clinical Consultation & Professional Support",
        tag: "Ongoing / When Needed",
        description: prediction === "High" || prediction === "Moderate"
          ? "Because your assessment indicates moderate to high distress, schedule an appointment with a licensed psychologist, psychiatrist, or counselor for a formal clinical evaluation and evidence-based therapy (CBT, ACT)."
          : "Continue periodic self-checks every 2-4 weeks to monitor your emotional trajectory. If symptoms ever increase in frequency or interfere with work or relationships, consult a healthcare provider."
      }
    ];

    return {
      acuteSteps,
      shortTermSteps,
      mediumTermSteps,
      longTermSteps,
      allSteps: [...acuteSteps, ...shortTermSteps, ...mediumTermSteps, ...longTermSteps]
    };
  }

  // Expose to window
  window.AdaptiveQuizEngine = {
    QUESTION_BANK,
    getNextAdaptiveQuestion,
    aggregateAnswersToRF,
    generateSituationAnalysis,
    generateStepByStepReliefPlan
  };
})();
