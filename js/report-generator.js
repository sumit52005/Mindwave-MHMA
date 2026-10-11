/**
 * Comprehensive Mental Health Assessment Report Generator
 * Mindwave Mental Health Management Application (MHMA)
 * Features In-Depth Clinical Situation Analysis, Step-by-Step Relief Plan, and jsPDF Multi-Page Export.
 */

(function () {
  const LEVEL_COLORS = {
    Good:     { r: 22,  g: 163, b: 74,  hex: '#16a34a' },
    Mild:     { r: 2,   g: 132, b: 199, hex: '#0284c7' },
    Moderate: { r: 217, g: 119, b: 6,   hex: '#d97706' },
    High:     { r: 220, g: 38,  b: 38,  hex: '#dc2626' }
  };

  const HELPLINES = [
    { name: "Tele-MANAS (Govt of India)", number: "14416 / 1800-891-4416", desc: "24/7 Free Comprehensive Mental Health Service" },
    { name: "KIRAN Helpline", number: "1800-599-0019", desc: "24/7 Dedicated Mental Health Rehabilitation Support" },
    { name: "Vandrevala Foundation", number: "+91 9999 666 555", desc: "24/7 Free Crisis Counseling & Emotional Support" },
    { name: "AASRA Helpline", number: "+91 98204 66726", desc: "24/7 Confidential Suicide Prevention & Crisis Line" }
  ];

  function buildReportData(mlResult, answers, adaptiveHistory) {
    const now = new Date();
    const history = adaptiveHistory || (window.AdaptiveQuizHistory || []);

    // Generate situation analysis and relief plan if not already present
    let situationAnalysis = mlResult.situationAnalysis;
    let reliefPlan = mlResult.reliefPlan;

    if (!situationAnalysis && window.AdaptiveQuizEngine) {
      situationAnalysis = window.AdaptiveQuizEngine.generateSituationAnalysis(history, mlResult);
    }
    if (!reliefPlan && window.AdaptiveQuizEngine) {
      reliefPlan = window.AdaptiveQuizEngine.generateStepByStepReliefPlan(mlResult, situationAnalysis);
    }

    return {
      generatedAt: now.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }),
      isoDate: now.toISOString().split('T')[0],
      reportId: 'MWR-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      answers: answers || {},
      history: history,
      situationAnalysis: situationAnalysis || {},
      reliefPlan: reliefPlan || { allSteps: [] },
      ...mlResult
    };
  }

  // ── HTML In-Page Report Viewer ──
  function renderReportInPage(mlResult, answers, adaptiveHistory) {
    const data = buildReportData(mlResult, answers, adaptiveHistory);
    const lc = LEVEL_COLORS[data.prediction] || LEVEL_COLORS.Good;
    const levelColor = lc.hex;

    // Adaptive Question Breakdown Rows
    let qRows = '';
    if (data.history && data.history.length > 0) {
      data.history.forEach((h, idx) => {
        const score = h.selectedOption.score;
        const sev = score === 0 ? 'Minimal' : score === 1 ? 'Mild' : score === 2 ? 'Moderate' : 'Severe';
        const sevClass = `severity-${sev}`;
        qRows += `
          <tr>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; font-weight:700; color:#334155;">Q${idx + 1}</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0;">
              <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#0369a1;">${h.question.domain}</div>
              <div style="color:#1e293b; font-weight:500;">${h.question.text}</div>
            </td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; color:#475569; font-weight:500;">${h.selectedOption.text}</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:700;">${score} / 3</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center;"><span class="severity-pill ${sevClass}">${sev}</span></td>
          </tr>
        `;
      });
    } else {
      // Fallback if no adaptive history
      for (let i = 1; i <= 8; i++) {
        const val = data.answers[`q${i}`] !== undefined ? data.answers[`q${i}`] : 0;
        const sev = val === 0 ? 'Minimal' : val === 1 ? 'Mild' : val === 2 ? 'Moderate' : 'Severe';
        qRows += `
          <tr>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; font-weight:600;">Q${i}</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0;">Domain Factor ${i}</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0;">Score ${val}</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center;">${val} / 3</td>
            <td style="padding:0.65rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center;"><span class="severity-pill severity-${sev}">${sev}</span></td>
          </tr>
        `;
      }
    }

    // Probability bars
    let probBars = '';
    const probColors = { Good: '#10b981', Mild: '#38bdf8', Moderate: '#f59e0b', High: '#ef4444' };
    if (data.probabilities) {
      for (const cls of Object.keys(data.probabilities)) {
        const pct = data.probabilities[cls];
        probBars += `
          <div style="margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:600; color:#334155; margin-bottom:0.3rem;">
              <span>${cls}</span><span>${pct}%</span>
            </div>
            <div style="width:100%; height:10px; background:#e2e8f0; border-radius:6px; overflow:hidden;">
              <div style="width:${pct}%; height:100%; background:${probColors[cls] || '#94a3b8'}; border-radius:6px;"></div>
            </div>
          </div>
        `;
      }
    }

    // Top drivers
    let driverRows = '';
    if (data.topDrivers && data.topDrivers.length > 0) {
      data.topDrivers.forEach((d, idx) => {
        driverRows += `
          <tr>
            <td style="padding:0.5rem 0.8rem; border-bottom:1px solid #e2e8f0; font-weight:600;">#${idx + 1}</td>
            <td style="padding:0.5rem 0.8rem; border-bottom:1px solid #e2e8f0;">${d.dimension}</td>
            <td style="padding:0.5rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center;"><span class="severity-pill severity-${d.severity}">${d.severity}</span></td>
            <td style="padding:0.5rem 0.8rem; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:600;">${d.impactScore}</td>
          </tr>
        `;
      });
    } else {
      driverRows = `<tr><td colspan="4" style="padding:1rem; text-align:center; color:#16a34a; font-weight:600;">✨ All dimensions within healthy, minimal range.</td></tr>`;
    }

    // Step-by-Step Relief Plan HTML cards
    let reliefCardsHTML = '';
    if (data.reliefPlan && data.reliefPlan.allSteps && data.reliefPlan.allSteps.length > 0) {
      reliefCardsHTML = data.reliefPlan.allSteps.map(step => `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid ${levelColor}; border-radius:10px; padding:1.2rem 1.4rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="background:${levelColor}; color:#fff; font-size:0.8rem; font-weight:800; width:26px; height:26px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">${step.num}</span>
              <strong style="color:#0f172a; font-size:1rem;">${step.title}</strong>
            </div>
            <span style="background:#e0f2fe; color:#0369a1; font-size:0.75rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:20px;">⏱️ ${step.tag}</span>
          </div>
          <p style="margin:0; font-size:0.9rem; color:#475569; line-height:1.6;">${step.description}</p>
        </div>
      `).join('');
    }

    // Helpline Cards HTML
    const helplinesHTML = HELPLINES.map(h => `
      <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.8rem 1rem;">
        <div style="font-weight:700; color:#0f172a; font-size:0.92rem;">${h.name}</div>
        <div style="color:#dc2626; font-size:1.05rem; font-weight:800; margin:0.2rem 0; font-family:monospace;">📞 ${h.number}</div>
        <div style="font-size:0.78rem; color:#64748b;">${h.desc}</div>
      </div>
    `).join('');

    const sa = data.situationAnalysis || {};

    const reportHTML = `
      <div id="reportViewContent" style="max-width:850px; margin:0 auto; font-family:'Poppins',sans-serif; color:#1e293b;">

        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#fff; padding:2rem 2.5rem; border-radius:14px 14px 0 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <div style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.1); padding:0.25rem 0.7rem; border-radius:20px; font-size:0.75rem; margin-bottom:0.5rem; color:#38bdf8; font-weight:600;">
              🌲 Random Forest ML Ensemble • 95.1% Accuracy
            </div>
            <h2 style="margin:0 0 0.3rem; font-size:1.6rem; color:#fff;">MindEase Comprehensive Assessment Report</h2>
            <p style="margin:0; font-size:0.88rem; color:#94a3b8;">Adaptive Contextual Screening & Clinical Situation Analysis</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.78rem; color:#94a3b8;">Report Identifier</div>
            <div style="font-size:0.95rem; font-weight:700; font-family:monospace; color:#38bdf8;">${data.reportId}</div>
            <div style="font-size:0.78rem; color:#94a3b8; margin-top:0.3rem;">${data.generatedAt}</div>
          </div>
        </div>

        <!-- Predicted Mood State Hero Banner -->
        <div style="background:${levelColor}15; border:2px solid ${levelColor}; border-top:none; padding:1.8rem 2.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.2rem;">
          <div>
            <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#64748b; letter-spacing:0.05em;">Ensemble Classification</div>
            <div style="font-size:2rem; font-weight:800; color:${levelColor}; line-height:1.2;">${data.prediction} State</div>
            <div style="font-size:0.92rem; color:#475569; margin-top:0.3rem; font-weight:500;">
              ${sa.patternTitle || data.recommendation?.summary || 'Assessment evaluation complete.'}
            </div>
          </div>
          <div style="text-align:center; background:#fff; padding:1.1rem 1.6rem; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.06); border:1px solid #e2e8f0;">
            <div style="font-size:2.2rem; font-weight:800; color:${levelColor};">${data.confidence}%</div>
            <div style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">ML Confidence</div>
          </div>
        </div>

        <!-- Main Body -->
        <div style="background:#fff; padding:2.2rem 2.5rem; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 14px 14px;">

          <!-- SECTION 1: DETAILED SITUATION ANALYSIS -->
          <div style="background:linear-gradient(135deg, #f8fafc, #f1f5f9); border:1px solid #cbd5e1; border-radius:12px; padding:1.6rem; margin-bottom:2.2rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
              <span style="font-size:1.3rem;">🩺</span>
              <h3 style="font-size:1.2rem; font-weight:800; color:#0f172a; margin:0;">In-Depth Clinical Situation Analysis</h3>
            </div>
            
            <p style="font-size:0.95rem; color:#334155; line-height:1.6; margin-bottom:1.2rem;">
              <strong>Summary Assessment:</strong> ${sa.severitySummary || 'Responses reflect an adaptive evaluation across multiple clinical dimensions.'}
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem; margin-bottom:1rem;">
              <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:1.1rem;">
                <div style="font-size:0.78rem; text-transform:uppercase; font-weight:800; color:#0284c7; margin-bottom:0.3rem;">🧠 Physiological & Nervous System State</div>
                <div style="font-size:0.88rem; color:#475569; line-height:1.5;">${sa.physiologicalMechanism || 'Autonomic nervous system functioning within normal baseline parameters.'}</div>
              </div>
              <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:1.1rem;">
                <div style="font-size:0.78rem; text-transform:uppercase; font-weight:800; color:#7c3aed; margin-bottom:0.3rem;">💭 Cognitive & Emotional Processing</div>
                <div style="font-size:0.88rem; color:#475569; line-height:1.5;">${sa.cognitivePattern || 'Thought patterns reflect balanced cognitive processing with manageable stress reactivity.'}</div>
              </div>
            </div>

            ${sa.highDomains && sa.highDomains.length > 0 ? `
              <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:8px; padding:0.8rem 1.1rem; font-size:0.85rem; color:#9f1239;">
                <strong>⚠️ Primary Concern Areas Identified:</strong> ${sa.highDomains.join(', ')}. Targeted relief steps outlined below address these specific root triggers.
              </div>
            ` : `
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.8rem 1.1rem; font-size:0.85rem; color:#166534;">
                <strong>🌿 Protective Factors Intact:</strong> Vitality, cognitive clarity, and autonomic balance are currently stable. Focus on preventative resilience.
              </div>
            `}
          </div>

          <!-- SECTION 2: COMPREHENSIVE STEP-BY-STEP RELIEF PLAN -->
          <div style="margin-bottom:2.2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem; border-bottom:2px solid #e2e8f0; padding-bottom:0.6rem;">
              <h3 style="font-size:1.2rem; font-weight:800; color:#0f172a; margin:0;">
                🛠️ Actionable Step-by-Step Relief Plan
              </h3>
              <span style="font-size:0.82rem; font-weight:700; color:${levelColor}; background:${levelColor}15; padding:0.25rem 0.65rem; border-radius:20px;">
                Tailored for ${data.prediction} State
              </span>
            </div>

            <p style="font-size:0.88rem; color:#64748b; margin-bottom:1.2rem;">
              Follow this evidence-based clinical roadmap to de-escalate tension, reset biological rhythms, and regain emotional equilibrium:
            </p>

            <div class="relief-steps-container">
              ${reliefCardsHTML}
            </div>
          </div>

          <!-- SECTION 3: 24/7 CRISIS HELPLINES & SAFETY NET -->
          <div style="background:#fff8f6; border:1.5px solid #fca5a5; border-radius:12px; padding:1.4rem; margin-bottom:2.2rem;">
            <h4 style="margin:0 0 0.5rem; color:#991b1b; font-size:1rem; font-weight:800; display:flex; align-items:center; gap:0.4rem;">
              <span>🚨</span> Free, Confidential 24/7 Mental Health Helplines
            </h4>
            <p style="font-size:0.84rem; color:#7f1d1d; margin-bottom:1rem; line-height:1.5;">
              If you or someone you know is in acute distress or experiencing feelings of crisis, professional counselors are available immediately at zero cost:
            </p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:0.8rem;">
              ${helplinesHTML}
            </div>
          </div>

          <!-- SECTION 4: SCORE OVERVIEW & PROBABILITIES -->
          <h3 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin:0 0 1rem; border-bottom:2px solid #e2e8f0; padding-bottom:0.5rem;">📊 Clinical Subscales & Probability Spectrum</h3>
          <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.5rem; font-weight:800; color:#0f172a;">${data.totalScore}<span style="font-size:0.8rem; color:#94a3b8;"> / 24</span></div>
              <div style="font-size:0.78rem; color:#64748b; font-weight:600;">Total PHQ Score</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.5rem; font-weight:800; color:#0284c7;">${data.subscales?.depressionSubscale || 0}<span style="font-size:0.8rem; color:#94a3b8;"> / 9</span></div>
              <div style="font-size:0.78rem; color:#64748b; font-weight:600;">Depressive Subscale</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.5rem; font-weight:800; color:#d97706;">${data.subscales?.anxietySubscale || 0}<span style="font-size:0.8rem; color:#94a3b8;"> / 6</span></div>
              <div style="font-size:0.78rem; color:#64748b; font-weight:600;">Anxiety Subscale</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.5rem; font-weight:800; color:#7c3aed;">${data.subscales?.somaticSubscale || 0}<span style="font-size:0.8rem; color:#94a3b8;"> / 6</span></div>
              <div style="font-size:0.78rem; color:#64748b; font-weight:600;">Somatic / Sleep</div>
            </div>
          </div>

          <div style="margin-bottom:2rem;">
            ${probBars}
          </div>

          <!-- SECTION 5: ADAPTIVE QUESTION-WISE RESPONSE LOG -->
          <h3 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin:0 0 1rem; border-bottom:2px solid #e2e8f0; padding-bottom:0.5rem;">📋 Adaptive Assessment Journey (${data.history?.length || 8} Questions Answered)</h3>
          <div style="overflow-x:auto; margin-bottom:2rem;">
            <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:0.6rem 0.8rem; text-align:left; color:#64748b; font-weight:700; font-size:0.8rem; width:40px;">#</th>
                  <th style="padding:0.6rem 0.8rem; text-align:left; color:#64748b; font-weight:700; font-size:0.8rem;">Clinical Focus & Question</th>
                  <th style="padding:0.6rem 0.8rem; text-align:left; color:#64748b; font-weight:700; font-size:0.8rem;">Selected Response</th>
                  <th style="padding:0.6rem 0.8rem; text-align:center; color:#64748b; font-weight:700; font-size:0.8rem;">Score</th>
                  <th style="padding:0.6rem 0.8rem; text-align:center; color:#64748b; font-weight:700; font-size:0.8rem;">Severity</th>
                </tr>
              </thead>
              <tbody>
                ${qRows}
              </tbody>
            </table>
          </div>

          <!-- SECTION 6: KEY CONTRIBUTING FACTORS (XAI) -->
          <h3 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin:0 0 1rem; border-bottom:2px solid #e2e8f0; padding-bottom:0.5rem;">🔍 Key Contributing Drivers (Explainable AI)</h3>
          <table style="width:100%; border-collapse:collapse; margin-bottom:2rem; font-size:0.88rem;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="padding:0.5rem 0.8rem; text-align:left; color:#64748b; font-weight:700; font-size:0.8rem;">Rank</th>
                <th style="padding:0.5rem 0.8rem; text-align:left; color:#64748b; font-weight:700; font-size:0.8rem;">Dimension</th>
                <th style="padding:0.5rem 0.8rem; text-align:center; color:#64748b; font-weight:700; font-size:0.8rem;">Severity</th>
                <th style="padding:0.5rem 0.8rem; text-align:center; color:#64748b; font-weight:700; font-size:0.8rem;">Impact Weight</th>
              </tr>
            </thead>
            <tbody>
              ${driverRows}
            </tbody>
          </table>

          <!-- SECTION 7: MODEL INFO & DISCLAIMER -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1.2rem; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; font-size:0.85rem; color:#64748b;">
              <div><strong>Model Architecture:</strong> Random Forest Classifier (50 Trees, Depth 9)</div>
              <div><strong>Test Set Accuracy:</strong> 95.08% (20,000 Samples)</div>
              <div><strong>Feature Space:</strong> 14 Clinical Dimensions</div>
            </div>
          </div>

          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:1rem; font-size:0.82rem; color:#92400e; line-height:1.5;">
            <strong>⚠️ Important Medical Disclaimer:</strong> This assessment report is generated via machine learning algorithms for informational and self-monitoring screening purposes only. It does not provide or replace a clinical psychiatric or medical diagnosis. If you are experiencing persistent distress, severe anxiety, or thoughts of self-harm, please reach out to a licensed psychologist, psychiatrist, or the verified helplines above.
          </div>

        </div>
      </div>
    `;

    return { html: reportHTML, data };
  }

  // ── Multi-Page PDF Generation using jsPDF ──
  async function generatePDF(mlResult, answers, adaptiveHistory) {
    const data = buildReportData(mlResult, answers, adaptiveHistory);
    const lc = LEVEL_COLORS[data.prediction] || LEVEL_COLORS.Good;

    // Resolve jsPDF
    let jsPDFConstructor = null;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDFConstructor = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
      jsPDFConstructor = window.jsPDF;
    }

    if (!jsPDFConstructor) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        if (window.jspdf && window.jspdf.jsPDF) jsPDFConstructor = window.jspdf.jsPDF;
        else if (window.jsPDF) jsPDFConstructor = window.jsPDF;
      } catch (e) {
        console.error('Failed to load jsPDF:', e);
      }
    }

    if (!jsPDFConstructor) {
      alert('Could not initialize PDF engine. Please verify your connection.');
      return false;
    }

    const doc = new jsPDFConstructor('p', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 0;

    function checkPage(needed) {
      if (y + needed > pageH - 18) {
        doc.addPage();
        y = 16;
      }
    }

    function drawHeader() {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MindEase Clinical Assessment Report', margin, 15);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Random Forest Machine Learning • Adaptive Screening & Situation Analysis', margin, 22);
      doc.setFontSize(8);
      doc.text(`Report ID: ${data.reportId}`, pageW - margin, 14, { align: 'right' });
      doc.text(`Generated: ${data.generatedAt}`, pageW - margin, 21, { align: 'right' });
      y = 42;
    }

    function drawSectionTitle(title) {
      checkPage(12);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentW, 7, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 4, y + 5);
      y += 11;
    }

    // ── PAGE 1 ──
    drawHeader();

    // Predicted State Banner
    doc.setFillColor(lc.r, lc.g, lc.b);
    doc.roundedRect(margin, y, contentW, 26, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PREDICTED MOOD STATE', margin + 8, y + 9);
    doc.setFontSize(18);
    doc.text(data.prediction.toUpperCase(), margin + 8, y + 20);
    doc.setFontSize(13);
    doc.text(`${data.confidence}%`, pageW - margin - 8, y + 11, { align: 'right' });
    doc.setFontSize(7.5);
    doc.text('ML Confidence', pageW - margin - 8, y + 18, { align: 'right' });
    y += 32;

    // Score Overview Boxes
    drawSectionTitle('Score Overview & Clinical Subscales');
    const subscores = [
      { label: 'Total Score', val: `${data.totalScore} / 24`, col: [15, 23, 42] },
      { label: 'Depressive Subscale', val: `${data.subscales?.depressionSubscale || 0} / 9`, col: [2, 132, 199] },
      { label: 'Anxiety Subscale', val: `${data.subscales?.anxietySubscale || 0} / 6`, col: [217, 119, 6] },
      { label: 'Somatic / Sleep', val: `${data.subscales?.somaticSubscale || 0} / 6`, col: [124, 58, 237] }
    ];
    const boxW = (contentW - 9) / 4;
    subscores.forEach((s, i) => {
      const bx = margin + i * (boxW + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bx, y, boxW, 16, 2, 2, 'FD');
      doc.setTextColor(...s.col);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(s.val, bx + boxW / 2, y + 8, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(s.label, bx + boxW / 2, y + 13, { align: 'center' });
    });
    y += 22;

    // Probability Bars
    drawSectionTitle('Random Forest Probability Distribution');
    const pCols = { Good: [16, 185, 129], Mild: [56, 189, 248], Moderate: [245, 158, 11], High: [239, 68, 68] };
    if (data.probabilities) {
      Object.keys(data.probabilities).forEach(cls => {
        checkPage(9);
        const pct = data.probabilities[cls];
        const pc = pCols[cls] || [148, 163, 184];
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(cls, margin + 4, y + 3);
        doc.text(`${pct}%`, margin + contentW - 4, y + 3, { align: 'right' });
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin + 4, y + 4.5, contentW - 8, 3.5, 1.5, 1.5, 'F');
        const fillW = ((contentW - 8) * pct) / 100;
        if (fillW > 0) {
          doc.setFillColor(...pc);
          doc.roundedRect(margin + 4, y + 4.5, Math.max(fillW, 2), 3.5, 1.5, 1.5, 'F');
        }
        y += 10;
      });
    }
    y += 4;

    // Top Contributing Factors
    drawSectionTitle('Key Contributing Factors (Explainable AI)');
    if (data.topDrivers && data.topDrivers.length > 0) {
      data.topDrivers.forEach((d, idx) => {
        checkPage(7);
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`#${idx + 1}`, margin + 4, y + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.text(d.dimension, margin + 14, y + 3.5);
        doc.text(d.severity, margin + 115, y + 3.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`Score: ${d.score}/3`, margin + 148, y + 3.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 5.5, margin + contentW, y + 5.5);
        y += 7.5;
      });
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(8);
      doc.text('All dimensions within healthy, minimal range.', margin + 4, y + 3.5);
      y += 8;
    }
    y += 6;

    // ── PAGE 2: SITUATION ANALYSIS & QUESTION BREAKDOWN ──
    doc.addPage();
    y = 18;

    drawSectionTitle('Detailed Clinical Situation Analysis');
    const sa = data.situationAnalysis || {};

    // Situation Summary Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentW, 20, 2, 2, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Pattern Identified: ${sa.patternTitle || 'Comprehensive Analysis'}`, margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const sumLines = doc.splitTextToSize(sa.severitySummary || 'Evaluation completed based on adaptive screening.', contentW - 8);
    doc.text(sumLines, margin + 4, y + 10);
    y += 25;

    // Physiology & Cognition details
    checkPage(30);
    doc.setTextColor(2, 132, 199);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Physiological & Nervous System State:', margin + 2, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const physLines = doc.splitTextToSize(sa.physiologicalMechanism || 'Autonomic nervous system within normal parameters.', contentW - 6);
    doc.text(physLines, margin + 2, y + 7.5);
    y += physLines.length * 4 + 7;

    checkPage(30);
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Cognitive & Emotional Processing Patterns:', margin + 2, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const cogLines = doc.splitTextToSize(sa.cognitivePattern || 'Thought patterns reflect balanced baseline appraisal.', contentW - 6);
    doc.text(cogLines, margin + 2, y + 7.5);
    y += cogLines.length * 4 + 10;

    // Adaptive Question Breakdown Table
    drawSectionTitle(`Adaptive Assessment Journey (${data.history?.length || 8} Questions)`);
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentW, 6, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('#', margin + 3, y + 4);
    doc.text('Domain / Question', margin + 12, y + 4);
    doc.text('Selected Response', margin + 98, y + 4);
    doc.text('Score', margin + 148, y + 4);
    doc.text('Severity', margin + 162, y + 4);
    y += 8;

    if (data.history && data.history.length > 0) {
      data.history.forEach((h, idx) => {
        checkPage(10);
        const score = h.selectedOption.score;
        const sev = score === 0 ? 'Minimal' : score === 1 ? 'Mild' : score === 2 ? 'Moderate' : 'Severe';
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(`Q${idx + 1}`, margin + 3, y + 3.5);
        doc.setFont('helvetica', 'normal');
        const qShort = h.question.text.length > 58 ? h.question.text.substring(0, 56) + '...' : h.question.text;
        doc.text(qShort, margin + 12, y + 3.5);
        const respShort = h.selectedOption.text.length > 32 ? h.selectedOption.text.substring(0, 30) + '...' : h.selectedOption.text;
        doc.text(respShort, margin + 98, y + 3.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${score}/3`, margin + 150, y + 3.5);
        if (score >= 2) doc.setTextColor(220, 38, 38);
        else if (score === 1) doc.setTextColor(2, 132, 199);
        else doc.setTextColor(100, 116, 139);
        doc.text(sev, margin + 163, y + 3.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 5.5, margin + contentW, y + 5.5);
        y += 7.5;
      });
    }
    y += 4;

    // ── PAGE 3: STEP-BY-STEP RELIEF PLAN & CRISIS SUPPORT ──
    doc.addPage();
    y = 18;

    drawSectionTitle('Step-by-Step Clinical Relief Plan');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Roadmap to de-escalate tension, restore circadian rhythms, and regain balance:', margin + 2, y + 2);
    y += 7;

    const allSteps = (data.reliefPlan && data.reliefPlan.allSteps) || [];
    allSteps.forEach(step => {
      checkPage(16);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentW, 14, 2, 2, 'FD');
      // Step number circle
      doc.setFillColor(lc.r, lc.g, lc.b);
      doc.circle(margin + 5, y + 4.5, 2.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(String(step.num), margin + 5, y + 5.5, { align: 'center' });
      // Step Title & Tag
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(step.title, margin + 10, y + 4.5);
      doc.setTextColor(2, 132, 199);
      doc.setFontSize(6.5);
      doc.text(step.tag, margin + contentW - 4, y + 4.5, { align: 'right' });
      // Description
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(step.description, contentW - 14);
      doc.text(descLines, margin + 10, y + 8.5);
      y += 16.5;
    });

    // 24/7 Helplines Section
    checkPage(28);
    y += 2;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, y, contentW, 26, 2, 2, 'FD');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('24/7 Free & Confidential Mental Health Helplines', margin + 4, y + 5);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29);
    doc.text('• Tele-MANAS (Govt of India): 14416 / 1800-891-4416 (Free 24/7)', margin + 4, y + 10);
    doc.text('• KIRAN Helpline: 1800-599-0019 (24/7 Rehabilitation Support)', margin + 4, y + 14);
    doc.text('• Vandrevala Foundation: +91 9999 666 555 (Free 24/7 Crisis Counseling)', margin + 4, y + 18);
    doc.text('• AASRA Helpline: +91 98204 66726 (24/7 Suicide Prevention Line)', margin + 4, y + 22);
    y += 31;

    // Disclaimer & Footer
    checkPage(16);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(margin, y, contentW, 13, 2, 2, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Disclaimer:', margin + 4, y + 4);
    doc.setFont('helvetica', 'normal');
    const discLines = doc.splitTextToSize('This report is generated via machine learning for informational wellness screening only and does not constitute medical diagnosis. If you are experiencing persistent distress or crisis, please contact a licensed mental health professional.', contentW - 8);
    doc.text(discLines, margin + 4, y + 7.5);
    y += 16;

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.text(`MindEase Portal © ${new Date().getFullYear()} | Random Forest Ensemble Model | Page 3 of 3`, pageW / 2, pageH - 8, { align: 'center' });

    doc.save(`MindEase_Clinical_Report_${data.isoDate}_${data.reportId}.pdf`);
    return true;
  }

  window.renderReportInPage = renderReportInPage;
  window.generatePDF = generatePDF;
})();
