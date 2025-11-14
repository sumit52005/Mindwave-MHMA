const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', async function () {
  const form = document.getElementById('quizForm');
  let total = 0;

  for (let i = 1; i <= 8; i++) {
    // FIX 1: Get selected radio properly
    const selected = form.querySelector('input[name="q' + i + '"]:checked');

    if (!selected) {
      window.showNotification("Please answer question " + i, "error");
      return;
    }

    const value = selected.value;
    total += parseInt(value);
  }

  // Determine level
  let finalLevel = '';
  if (total <= 8) finalLevel = 'Good';
  else if (total <= 16) finalLevel = 'Mild';
  else if (total <= 24) finalLevel = 'Moderate';
  else finalLevel = 'High';

  // FIX 2: Ensure saveAssessment exists
  if (typeof window.saveAssessment !== "function") {
    console.error("saveAssessment is not defined. Check js/assessment.js loaded.");
    window.showNotification("Internal error: saveAssessment missing", "error");
    return;
  }

  // Save to Supabase
  await window.saveAssessment(total, finalLevel);

  // UI display
  let resultText = '';
  if (total <= 8) resultText = 'Feeling Good – stable mood.';
  else if (total <= 16) resultText = 'Mild Mood Dip – low stress.';
  else if (total <= 24) resultText = 'Moderate Concern – monitor yourself.';
  else resultText = 'High Concern – consider support.';

  document.getElementById('resultText').textContent = resultText;
  document.getElementById('resultBox').classList.remove('hidden');
  window.scrollTo(0, document.getElementById('resultBox').offsetTop);

  window.showNotification("Assessment saved ✔", "success");
});
