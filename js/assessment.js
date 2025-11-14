// js/assessment.js
async function saveAssessment(score, level) {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      showNotification('Please sign in to save assessment', 'error');
      window.location.href = 'login.html';
      return;
    }
    const userId = session.user.id;
    const { error } = await window.supabase.from('assessments').insert([{
      user_id: userId,
      score,
      level
    }]);

    if (error) {
      showNotification('Error saving assessment', 'error');
      console.error(error);
    } else {
      showNotification('Assessment saved!', 'success');
      if (window.refreshDashboard) window.refreshDashboard();
    }
  } catch (err) {
    showNotification('Error saving assessment', 'error');
    console.error(err);
  }
}

window.saveAssessment = saveAssessment;
