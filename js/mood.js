// js/mood.js
async function saveMood() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      showNotification('Please sign in first', 'error');
      window.location.href = 'login.html';
      return;
    }
    const userId = session.user.id;
    const moodEl = document.getElementById('mood-select');
    const noteEl = document.getElementById('mood-note');

    const mood = moodEl ? moodEl.value : '';
    const note = noteEl ? noteEl.value.trim() : '';

    const { error } = await window.supabase.from('moods').insert([{
      user_id: userId,
      mood,
      note
    }]);

    if (error) {
      showNotification('Failed to save mood', 'error');
      console.error(error);
    } else {
      showNotification('Mood saved successfully!', 'success');
      if (noteEl) noteEl.value = '';
      // optional: refresh dashboard if open
      if (window.refreshDashboard) window.refreshDashboard();
    }
  } catch (err) {
    showNotification('Error saving mood', 'error');
    console.error(err);
  }
}

window.saveMood = saveMood;
