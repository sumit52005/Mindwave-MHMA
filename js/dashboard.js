// js/dashboard.js
async function fetchDashboardData() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    const userId = session.user.id;

    // profile
    const { data: profile } = await window.supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle();

    // recent moods
    const { data: moods } = await window.supabase
      .from('moods').select('*').eq('user_id', userId).order('created_at', {ascending: false}).limit(5);

    // last assessment
    const { data: assessments } = await window.supabase
      .from('assessments').select('*').eq('user_id', userId).order('created_at', {ascending: false}).limit(5);

    // render
    if (profile && document.getElementById('welcome')) {
      document.getElementById('welcome').textContent = `Welcome, ${profile.full_name || profile.email}`;
    } else if (document.getElementById('welcome')) {
      document.getElementById('welcome').textContent = `Welcome, ${session.user.email}`;
    }

    const moodsEl = document.getElementById('recent-moods');
    if (moodsEl) {
      moodsEl.innerHTML = '';
      if (moods && moods.length) {
        moods.forEach(m => {
          moodsEl.innerHTML += `<div class="mood-item"><strong>${m.mood}</strong> — ${m.note ? m.note : 'No note'} <small>(${new Date(m.created_at).toLocaleString()})</small></div>`;
        });
      } else {
        moodsEl.innerHTML = '<p>No recent moods yet.</p>';
      }
    }

    const assessEl = document.getElementById('recent-assessments');
    if (assessEl) {
      assessEl.innerHTML = '';
      if (assessments && assessments.length) {
        assessments.forEach(a => {
          assessEl.innerHTML += `<div class="ass-item">Score: <strong>${a.score}</strong> — ${a.level} <small>(${new Date(a.created_at).toLocaleString()})</small></div>`;
        });
      } else {
        assessEl.innerHTML = '<p>No assessments yet.</p>';
      }
    }
  } catch (err) {
    console.error('fetchDashboardData error', err);
  }
}

// refresh helper for other modules
window.refreshDashboard = fetchDashboardData;
window.fetchDashboardData = fetchDashboardData;
