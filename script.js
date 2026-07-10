/* =========================================================
   AcademixStore — Author Application Form
   PHASE 2: submissions are now saved to Supabase (Postgres).
   Edit config.js with your project's URL + anon key before
   this will work. See SETUP.md for step-by-step instructions.
   ========================================================= */

(function () {
  const sb = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL')
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const form = document.getElementById('authorForm');
  const submitBtn = document.getElementById('submitBtn');
  const successPanel = document.getElementById('successPanel');
  const successName = document.getElementById('successName');
  const successEmail = document.getElementById('successEmail');
  const editAgainBtn = document.getElementById('editAgainBtn');
  const motivation = document.getElementById('motivation');
  const motivationCount = document.getElementById('motivationCount');

  /* ---------- character counter ---------- */
  motivation.addEventListener('input', () => {
    const len = motivation.value.length;
    motivationCount.textContent = Math.min(len, 500);
    if (len > 500) {
      motivation.value = motivation.value.slice(0, 500);
      motivationCount.textContent = 500;
    }
  });

  /* ---------- validators ---------- */
  const validators = {
    fullName: (v) => v.trim().length >= 2 || 'Please enter your full name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
    phone: (v) => /^[6-9]\d{9}$/.test(v.trim()) || 'Enter a valid 10-digit Indian mobile number.',
    city: (v) => v.trim().length >= 2 || 'Please enter your city.',
    state: (v) => v.trim().length > 0 || 'Please select your state.',
    institution: (v) => v.trim().length >= 2 || 'Please enter your institution name.',
    qualification: (v) => v.trim().length >= 2 || 'Please enter your highest qualification.',
    experience: (v) => v.trim().length > 0 || 'Please select your experience range.',
    subject: (v) => v.trim().length >= 2 || 'Please enter your subject or domain.',
    portfolio: (v) => v.trim() === '' || /^https?:\/\/.+/.test(v.trim()) || 'Enter a valid URL starting with http(s)://',
    motivation: (v) => v.trim().length >= 30 || 'Please write at least 30 characters.',
    agree: (v, el) => el.checked || 'You must agree to the privacy policy to continue.',
  };

  function fieldWrapper(el) {
    return el.closest('.form-field');
  }

  function showError(name, message) {
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    const wrapper = fieldWrapper(form.elements[name]);
    if (errorEl) errorEl.textContent = message || '';
    if (wrapper) wrapper.classList.toggle('field-invalid', !!message);
  }

  function validateField(name) {
    const el = form.elements[name];
    if (!el || !validators[name]) return true;
    const value = el.type === 'checkbox' ? el.checked : el.value;
    const result = validators[name](value, el);
    if (result === true) {
      showError(name, '');
      return true;
    }
    showError(name, result);
    return false;
  }

  /* live-validate on blur */
  Object.keys(validators).forEach((name) => {
    const el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', () => validateField(name));
    el.addEventListener('input', () => {
      const wrapper = fieldWrapper(el);
      if (wrapper && wrapper.classList.contains('field-invalid')) validateField(name);
    });
  });

  /* ---------- storage (Supabase) ---------- */
  async function saveApplication(data) {
    if (!sb) {
      throw new Error(
        'Supabase is not configured yet. Add your project URL and anon key to config.js.'
      );
    }

    const { error } = await sb.from('author_applications').insert([
      {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        institution: data.institution,
        qualification: data.qualification,
        experience: data.experience,
        subject: data.subject,
        book_idea: data.bookIdea || null,
        portfolio: data.portfolio || null,
        motivation: data.motivation,
        agree: data.agree,
      },
    ]);

    if (error) throw error;
    return { ok: true };
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fieldNames = Object.keys(validators);
    const results = fieldNames.map((name) => validateField(name));
    const isValid = results.every(Boolean);

    if (!isValid) {
      const firstInvalid = form.querySelector('.field-invalid input, .field-invalid select, .field-invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.agree = form.elements.agree.checked;

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');

    try {
      await saveApplication(data);
      successName.textContent = data.fullName || 'there';
      successEmail.textContent = data.email || 'you';
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      alert(
        err && err.message
          ? `We couldn't submit your application: ${err.message}`
          : "Something went wrong submitting your application. Please try again."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
    }
  });

  editAgainBtn.addEventListener('click', () => {
    form.reset();
    motivationCount.textContent = '0';
    Object.keys(validators).forEach((name) => showError(name, ''));
    form.hidden = false;
    successPanel.hidden = true;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
