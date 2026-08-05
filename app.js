/* =====================================================
   NEXT-START UP CONCLAVE 2026 — Frontend JS
   Uses EmailJS (free) to send emails directly from
   the browser. No backend server required.

   SETUP (5 minutes):
   1. Go to https://emailjs.com and create a free account
   2. Add an Email Service (Gmail, Outlook, etc.)
   3. Create two Email Templates (see README for templates)
   4. Replace the four placeholders below with your IDs
   ===================================================== */

const EMAILJS_PUBLIC_KEY       = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID       = 'YOUR_SERVICE_ID';
const EMAILJS_REG_TEMPLATE     = 'template_a5o2yt8';
const EMAILJS_CONTACT_TEMPLATE = 'template_s40k5gr';

/* ── Simple in-memory duplicate guard ── */
const registeredEmails = new Set();
const subscribedEmails = new Set();

/* =====================================================
   NAVBAR SCROLL
===================================================== */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.background = window.scrollY > 50
    ? 'rgba(13,13,13,0.98)'
    : 'rgba(13,13,13,0.92)';
});

/* =====================================================
   HAMBURGER MENU
===================================================== */
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.toggle('open');
});
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* =====================================================
   SCROLL REVEAL
===================================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = Array.from(entry.target.parentElement?.children || []);
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =====================================================
   COUNTDOWN TIMER
===================================================== */
const eventDate = new Date('2026-04-12T09:00:00');
function updateCountdown() {
  const diff = eventDate - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hrs','cd-min','cd-sec'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }
  document.getElementById('cd-days').textContent = String(Math.floor(diff / 86400000)).padStart(2,'0');
  document.getElementById('cd-hrs').textContent  = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
  document.getElementById('cd-min').textContent  = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
  document.getElementById('cd-sec').textContent  = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* =====================================================
   HELPERS
===================================================== */
function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'form-msg ' + type;
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 8000);
}

function setBtn(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : label;
}

const COLLEGE_DOMAINS = [
  '.edu', '.ac.in', '.edu.in', '.ac.uk', '.ac.nz',
  '.ac.za', '.edu.au', '.ac.jp', '.edu.sg', '.ac.ae', '.edu.hk'
];

function isCollegeEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return COLLEGE_DOMAINS.some(d => email.toLowerCase().includes(d));
}

const TICKET_LABELS = {
  day1: 'Day 1 Pass – April 12, 2026',
  day2: 'Day 2 Pass – April 13, 2026',
  full: 'Full Event Pass – April 12–13, 2026',
};

/* =====================================================
   EMAILJS SENDER
   Falls back gracefully if keys are not yet configured.
===================================================== */
async function sendViaEmailJS(templateId, params) {
  if (EMAILJS_PUBLIC_KEY === '_JUv2_BQ3U8SOq8yj') {
    // Keys not set up yet — simulate success so UI still works for demo
    console.info('[Demo mode] EmailJS not configured. Would have sent:', params);
    return { status: 200 };
  }
  if (typeof emailjs === 'undefined') {
    throw new Error('EmailJS SDK not loaded.');
  }
  return emailjs.send(EMAILJS_SERVICE_ID, templateId, params, EMAILJS_PUBLIC_KEY);
}

/* =====================================================
   REGISTRATION FORM
===================================================== */
async function handleRegister() {
  const name    = document.getElementById('regName').value.trim();
  const email   = document.getElementById('regEmail').value.trim();
  const college = document.getElementById('regCollege').value.trim();
  const ticket  = document.getElementById('regTicket').value;
  const phone   = document.getElementById('regPhone').value.trim();

  if (!name || !email || !college || !ticket) {
    showMsg('regMsg', 'error', 'Please fill in all required fields.');
    return;
  }
  if (!isCollegeEmail(email)) {
    showMsg('regMsg', 'error',
      'Please use your college email (e.g. name@college.ac.in or name@university.edu).');
    return;
  }
  if (registeredEmails.has(email.toLowerCase())) {
    showMsg('regMsg', 'error', 'This email has already been registered.');
    return;
  }

  setBtn('regBtn', true, '');

  try {
    await sendViaEmailJS(EMAILJS_REG_TEMPLATE, {
      to_name:    name,
      to_email:   email,
      college:    college,
      ticket:     TICKET_LABELS[ticket] || ticket,
      phone:      phone || 'Not provided',
      event_date: 'April 12–13, 2026',
      venue:      'Mumbai Convention Centre, BKC',
    });

    registeredEmails.add(email.toLowerCase());
    showMsg('regMsg', 'success',
      'Registration successful! A confirmation has been sent to ' + email);

    document.getElementById('regName').value    = '';
    document.getElementById('regEmail').value   = '';
    document.getElementById('regCollege').value = '';
    document.getElementById('regTicket').value  = '';
    document.getElementById('regPhone').value   = '';

  } catch (err) {
    console.error('Registration error:', err);
    showMsg('regMsg', 'error',
      'Could not send confirmation email. Please contact info@nexus.com directly.');
  } finally {
    setBtn('regBtn', false, 'Register Now →');
  }
}

/* =====================================================
   CONTACT FORM
===================================================== */
async function handleContact() {
  const name    = document.getElementById('ctName').value.trim();
  const email   = document.getElementById('ctEmail').value.trim();
  const subject = document.getElementById('ctSubject').value.trim();
  const message = document.getElementById('ctMsg').value.trim();

  if (!name || !email || !subject || !message) {
    showMsg('contactMsg', 'error', 'Please fill in all fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMsg('contactMsg', 'error', 'Please enter a valid email address.');
    return;
  }

  try {
    await sendViaEmailJS(EMAILJS_CONTACT_TEMPLATE, {
      from_name:  name,
      from_email: email,
      subject:    subject,
      message:    message,
    });

    showMsg('contactMsg', 'success', "Message sent! We'll get back to you within 24 hours.");
    document.getElementById('ctName').value    = '';
    document.getElementById('ctEmail').value   = '';
    document.getElementById('ctSubject').value = '';
    document.getElementById('ctMsg').value     = '';
  } catch (err) {
    console.error('Contact error:', err);
    showMsg('contactMsg', 'error',
      'Could not send message. Please email us at info@nexus.com.');
  }
}

/* =====================================================
   SUBSCRIBE
===================================================== */
function handleSubscribe() {
  const email = document.getElementById('subEmail').value.trim();
  if (!email) {
    showMsg('subMsg', 'error', 'Please enter your email address.');
    return;
  }
  if (!isCollegeEmail(email)) {
    showMsg('subMsg', 'error', 'Please use your college email to subscribe.');
    return;
  }
  if (subscribedEmails.has(email.toLowerCase())) {
    showMsg('subMsg', 'error', 'This email is already subscribed.');
    return;
  }
  subscribedEmails.add(email.toLowerCase());
  showMsg('subMsg', 'success', "Subscribed! You'll receive event updates at " + email);
  document.getElementById('subEmail').value = '';
}
