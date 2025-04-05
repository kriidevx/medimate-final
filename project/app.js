import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const loginForm = document.getElementById('login-form');
  const signupBtn = document.getElementById('signup-btn');

  function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadReminders(); // <- FIXED: this function now exists below
  }

  function showLogin() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }

  // Auth state
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) showApp();
    else showLogin();
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) showApp();
    else showLogin();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('Login failed: ' + error.message);
  });

  signupBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('Signup failed: ' + error.message);
    else alert('Check your email to confirm your account.');
  });
});

// ✅ Add Reminder function
window.addReminder = async function () {
  const name = document.getElementById('medicine-name').value.trim();
  const time = document.getElementById('medicine-time').value;

  if (!name || !time) {
    alert('Please fill both fields');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('You must be logged in to add a reminder.');
    return;
  }

  const { error } = await supabase
    .from('reminders') // Make sure this table exists
    .insert([{ user_id: user.id, medicine: name, time: time }]);

  if (error) {
    console.error(error);
    alert('Failed to add reminder');
  } else {
    alert('Reminder added!');
    loadReminders();
  }
};

// ✅ Load Reminders function
window.loadReminders = async function () {
  const { data: { user } } = await supabase.auth.getUser();
  const container = document.getElementById('reminders-container');
  container.innerHTML = '';

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    container.innerHTML = '<p>Failed to load reminders</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p>No reminders yet.</p>';
    return;
  }

  data.forEach((reminder) => {
    const div = document.createElement('div');
    div.className = 'reminder';
    div.innerHTML = `<strong>${reminder.medicine}</strong> at ${reminder.time}`;
    container.appendChild(div);
  });
};
