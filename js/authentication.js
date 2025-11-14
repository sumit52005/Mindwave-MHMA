// js/authentication.js
// Sign up, sign in, logout, ensure profile exists

// Ensure profile exists after sign-in (safe because session exists)
async function ensureProfileExists(user, name) {
  try {
    const { data: existing } = await window.supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      await window.supabase.from('profiles').insert([
        {
          id: user.id,
          full_name: name || user.user_metadata?.full_name || null,
          email: user.email
        }
      ]);
    }
  } catch (err) {
    console.warn('ensureProfileExists error', err);
  }
}

async function supaSignup(name, email, password) {
  try {
    const { data, error } = await window.supabase.auth.signUp(
      { email, password },
      { data: { full_name: name } }
    );

    if (error) {
      window.showNotification(error.message || 'Signup failed', 'error');
      return null;
    }

    if (data?.user) {
      try {
        await window.supabase.from('profiles').insert([
          { id: data.user.id, full_name: name, email }
        ]);
      } catch (e) {
        console.warn('Profile insert error (may require email verification)', e);
      }
    }

    window.showNotification('Account created ✔ Please sign in.', 'success');
    setTimeout(() => (window.location.href = 'signin.html'), 1200);
    return data;
  } catch (err) {
    window.showNotification(err.message || 'Signup error', 'error');
    return null;
  }
}

async function supaSignin(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      window.showNotification(error.message || 'Invalid credentials', 'error');
      return null;
    }

    const session = data?.session;

    if (session?.user) {
      await ensureProfileExists(
        session.user,
        session.user.user_metadata?.full_name
      );
    }

    window.showNotification('Signed in ✔ Redirecting...', 'success');
    setTimeout(() => (window.location.href = 'explore.html'), 1200);

    return data;
  } catch (err) {
    window.showNotification(err.message || 'Sign in error', 'error');
    return null;
  }
}

// ✅ ADDING LOGOUT SEGMENT (you requested this)
async function supaLogout() {
  try {
    await window.supabase.auth.signOut();
    window.showNotification('Logged out ✔ Redirecting...', 'success');
    setTimeout(() => (window.location.href = 'index.html'), 900);
  } catch {
    window.showNotification('Logout error', 'error');
  }
}

// Ensure user is logged in before visiting protected pages
async function ensureAuthOrRedirect() {
  const { data } = await window.supabase.auth.getSession();
  const session = data?.session;

  if (!session) {
    window.location.href = 'signin.html'; // fixed
    return null;
  }

  return session.user;
}

// EXPOSE FUNCTIONS
window.supaSignup = supaSignup;
window.supaSignin = supaSignin;
window.supaLogout = supaLogout;
window.ensureAuthOrRedirect = ensureAuthOrRedirect;
