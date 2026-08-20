/**
 * Next-Start Up Conclave 2026 – Backend Server
 * 
 * Endpoints:
 *   POST /register       – Register (college email only), send confirmation
 *   POST /contact        – Contact form
 *   POST /subscribe      – Subscribe to updates (college email only)
 *   POST /admin/notify   – Admin: send update notification to all subscribers
 * 
 * Setup:
 *   npm install express nodemailer cors dotenv
 *   Create .env (see .env.example)
 *   node server.js
 */

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
const PUBLIC_DIR = path.join(__dirname);

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use(express.static(PUBLIC_DIR));

/* ===== DATA STORE (JSON files – swap for a real DB in production) ===== */
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'startupconclave-data')
  : path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');
const SUBSCRIBERS_FILE   = path.join(DATA_DIR, 'subscribers.json');
const CONTACTS_FILE      = path.join(DATA_DIR, 'contacts.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ===== EMAIL TRANSPORTER ===== */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Next-Start Up Conclave 2026" <${process.env.SMTP_USER}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
const ADMIN_KEY   = process.env.ADMIN_KEY   || 'change-this-secret';

/* ===== COLLEGE EMAIL VALIDATOR ===== */
const ALLOWED_DOMAINS = [
  '.edu', '.ac.in', '.edu.in', '.ac.uk', '.ac.nz', '.ac.za',
  '.edu.au', '.ac.jp', '.edu.sg', '.ac.ae', '.edu.hk'
];

function isCollegeEmail(email) {
  const lower = email.toLowerCase();
  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return false;
  return ALLOWED_DOMAINS.some(d => lower.includes(d));
}

/* ===== TICKET LABELS ===== */
const TICKET_LABELS = {
  day1: 'Day 1 Pass – April 12, 2026',
  day2: 'Day 2 Pass – April 13, 2026',
  full: 'Full Event Pass – April 12–13, 2026 (Best Value)',
};

/* ===== EMAIL TEMPLATES ===== */
function registrationEmail(name, email, college, ticket) {
  const ticketLabel = TICKET_LABELS[ticket] || ticket;
  return {
    from: FROM,
    to: email,
    subject: '🎉 Registration Confirmed – Next-Start Up Conclave 2026',
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0D0D0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#F0F0F0}
  .wrap{max-width:600px;margin:0 auto;background:#111}
  .header{background:#E02020;padding:40px 40px 30px;text-align:center}
  .header h1{margin:0;font-size:2.2rem;letter-spacing:2px;color:#fff;font-family:Georgia,serif}
  .header p{margin:8px 0 0;color:rgba(255,255,255,.8);font-size:.9rem;letter-spacing:.1em}
  .body{padding:40px}
  .body h2{font-size:1.4rem;color:#F0F0F0;margin-bottom:12px}
  .body p{color:#aaa;line-height:1.7;font-size:.95rem;margin-bottom:16px}
  .ticket-box{background:#1A1A1A;border-left:4px solid #E02020;padding:24px 28px;margin:28px 0;border-radius:2px}
  .ticket-box h3{margin:0 0 16px;font-size:1rem;letter-spacing:.15em;color:#E02020;text-transform:uppercase;font-size:.8rem}
  .ticket-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #222;font-size:.9rem}
  .ticket-row:last-child{border-bottom:none}
  .ticket-label{color:#888}
  .ticket-val{color:#F0F0F0;font-weight:600}
  .cta{text-align:center;margin:36px 0}
  .cta a{display:inline-block;background:#E02020;color:#fff;text-decoration:none;padding:14px 36px;font-size:1rem;letter-spacing:.05em;font-weight:600}
  .footer{background:#0D0D0D;padding:28px 40px;text-align:center;border-top:1px solid #1a1a1a}
  .footer p{color:#555;font-size:.8rem;margin:4px 0}
  .footer a{color:#E02020;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>NEXT-START UP<br>CONCLAVE</h1>
    <p>MUMBAI · APRIL 12–13, 2026</p>
  </div>
  <div class="body">
    <h2>You're registered, ${name}! 🚀</h2>
    <p>Your spot at the Next-Start Up Conclave 2026 is confirmed. We're thrilled to have you join 1,000+ founders, investors, and innovators in Mumbai.</p>
    <div class="ticket-box">
      <h3>Your Registration Details</h3>
      <div class="ticket-row">
        <span class="ticket-label">Name</span>
        <span class="ticket-val">${name}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Email</span>
        <span class="ticket-val">${email}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">College</span>
        <span class="ticket-val">${college}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Ticket</span>
        <span class="ticket-val">${ticketLabel}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Venue</span>
        <span class="ticket-val">Mumbai Convention Centre, BKC</span>
      </div>
    </div>
    <p><strong>What to bring:</strong> Your student ID and this confirmation email (or the QR code we'll send closer to the date).</p>
    <p>If you have any questions, reply to this email or contact us at <a href="mailto:info@nexus.com" style="color:#E02020">info@nexus.com</a>.</p>
    <div class="cta">
      <a href="http://localhost:3001">View Event Details →</a>
    </div>
  </div>
  <div class="footer">
    <p>Next-Start Up Conclave 2026 · Mumbai Convention Centre</p>
    <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
  </div>
</div>
</body>
</html>`
  };
}

function updateNotificationEmail(subscriber, subject, message, adminName) {
  return {
    from: FROM,
    to: subscriber,
    subject: `🔔 ${subject} – Next-Start Up Conclave 2026`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0D0D0D;font-family:'Helvetica Neue',Arial,sans-serif;color:#F0F0F0}
  .wrap{max-width:600px;margin:0 auto;background:#111}
  .header{background:linear-gradient(135deg,#A01010,#E02020);padding:36px 40px;text-align:center}
  .header h1{margin:0;font-size:1.8rem;letter-spacing:2px;color:#fff;font-family:Georgia,serif}
  .tag{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-size:.75rem;letter-spacing:.15em;padding:4px 12px;margin-top:10px;text-transform:uppercase}
  .body{padding:40px}
  .body h2{font-size:1.3rem;color:#F0F0F0;margin-bottom:16px}
  .body p{color:#aaa;line-height:1.8;font-size:.95rem;margin-bottom:14px}
  .msg-box{background:#1A1A1A;border-left:4px solid #E02020;padding:24px 28px;margin:24px 0;border-radius:2px;color:#ddd;line-height:1.8;font-size:.95rem}
  .footer{background:#0D0D0D;padding:28px 40px;text-align:center;border-top:1px solid #1a1a1a}
  .footer p{color:#555;font-size:.8rem;margin:4px 0}
  .footer a{color:#E02020;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>NEXT-START UP CONCLAVE</h1>
    <span class="tag">Event Update</span>
  </div>
  <div class="body">
    <h2>${subject}</h2>
    <p>Hi there! Here's the latest update from the Conclave team:</p>
    <div class="msg-box">${message.replace(/\n/g, '<br>')}</div>
    <p>Stay tuned for more updates. We can't wait to see you in Mumbai!</p>
    <p style="color:#555;font-size:.85rem">— ${adminName || 'The Conclave Team'}</p>
  </div>
  <div class="footer">
    <p>Next-Start Up Conclave 2026 · Mumbai Convention Centre</p>
    <p>You're receiving this because you subscribed with your college email.</p>
    <p><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
  </div>
</div>
</body>
</html>`
  };
}

/* ===== ROUTES ===== */

/** POST /register */
app.post('/register', async (req, res) => {
  const { name, email, college, ticket, phone } = req.body;

  if (!name || !email || !college || !ticket) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  if (!isCollegeEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Only college emails are accepted (e.g. @college.ac.in, @university.edu). Please use your institutional email.'
    });
  }

  // Check duplicate
  const registrations = readJSON(REGISTRATIONS_FILE);
  const existing = registrations.find(r => r.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'This email is already registered. Check your inbox for the confirmation email.'
    });
  }

  // Save
  const record = {
    id: Date.now().toString(),
    name, email, college, ticket,
    phone: phone || '',
    registeredAt: new Date().toISOString()
  };
  registrations.push(record);
  writeJSON(REGISTRATIONS_FILE, registrations);

  // Send confirmation email
  try {
    await transporter.sendMail(registrationEmail(name, email, college, ticket));
  } catch (err) {
    console.error('Email send error:', err.message);
    // Still return success since registration saved
    return res.json({ success: true, message: 'Registered! (Email delivery may be delayed.)' });
  }

  // Notify admin
  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New Registration: ${name} (${college})`,
      text: `New registration:\n\nName: ${name}\nEmail: ${email}\nCollege: ${college}\nTicket: ${ticket}\nPhone: ${phone || 'N/A'}\nTime: ${record.registeredAt}`
    });
  } catch (e) { /* non-critical */ }

  return res.json({ success: true, message: 'Registration successful! Check your email for confirmation.' });
});

/** POST /contact */
app.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Save contact
  const contacts = readJSON(CONTACTS_FILE);
  contacts.push({ name, email, subject, message, at: new Date().toISOString() });
  writeJSON(CONTACTS_FILE, contacts);

  // Forward to admin
  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Subject:</strong> ${subject}</p><hr><p>${message.replace(/\n/g, '<br>')}</p>`
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    return res.json({ success: true }); // Still return success, message saved
  }
});

/** POST /subscribe */
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  if (!isCollegeEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Only college email addresses are accepted for updates.'
    });
  }

  const subscribers = readJSON(SUBSCRIBERS_FILE);
  const exists = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
  }

  subscribers.push({ email, subscribedAt: new Date().toISOString() });
  writeJSON(SUBSCRIBERS_FILE, subscribers);

  // Welcome email
  try {
    await transporter.sendMail({
      from: FROM,
      to: email,
      subject: '✅ You\'re subscribed to Next-Start Up Conclave 2026 Updates',
      html: `
        <div style="background:#0D0D0D;color:#F0F0F0;font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px">
          <h2 style="color:#E02020;font-size:1.5rem;margin-bottom:16px">You're in! 🚀</h2>
          <p style="color:#aaa;line-height:1.7">You've subscribed to updates for the <strong style="color:#F0F0F0">Next-Start Up Conclave 2026</strong>. We'll notify you of schedule changes, speaker announcements, and exclusive content.</p>
          <p style="color:#aaa;line-height:1.7;margin-top:16px">Event: <strong style="color:#F0F0F0">April 12–13, 2026</strong> · Mumbai Convention Centre</p>
          <p style="color:#555;font-size:.8rem;margin-top:32px">You can unsubscribe at any time.</p>
        </div>`
    });
  } catch (err) { console.error('Subscribe email error:', err.message); }

  return res.json({ success: true });
});

/**
 * POST /admin/notify
 * Protected – requires X-Admin-Key header
 * Body: { subject, message, adminName }
 * Sends the update to ALL subscribers
 */
app.post('/admin/notify', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { subject, message, adminName } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message are required.' });
  }

  const subscribers = readJSON(SUBSCRIBERS_FILE);
  if (subscribers.length === 0) {
    return res.json({ success: true, sent: 0, message: 'No subscribers yet.' });
  }

  let sent = 0;
  let failed = 0;

  // Send in batches to avoid rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await transporter.sendMail(updateNotificationEmail(sub.email, subject, message, adminName));
          sent++;
        } catch {
          failed++;
        }
      })
    );
    // Small delay between batches
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return res.json({ success: true, sent, failed, total: subscribers.length });
});

/** GET /admin/stats — quick dashboard (protected) */
app.get('/admin/stats', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) return res.status(401).json({ success: false });

  const registrations = readJSON(REGISTRATIONS_FILE);
  const subscribers   = readJSON(SUBSCRIBERS_FILE);
  const contacts      = readJSON(CONTACTS_FILE);

  const ticketBreakdown = registrations.reduce((acc, r) => {
    acc[r.ticket] = (acc[r.ticket] || 0) + 1;
    return acc;
  }, {});

  return res.json({
    registrations: registrations.length,
    subscribers: subscribers.length,
    contacts: contacts.length,
    ticketBreakdown,
    recent: registrations.slice(-5).map(r => ({ name: r.name, college: r.college, ticket: r.ticket, at: r.registeredAt }))
  });
});

/* ===== START ===== */
const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Next-Start Up Conclave Backend running on http://localhost:${PORT}\n`);
    console.log(`  POST /register          – Student registration (college email only)`);
    console.log(`  POST /contact           – Contact form`);
    console.log(`  POST /subscribe         – Newsletter subscription`);
    console.log(`  POST /admin/notify      – Send update to all subscribers (requires X-Admin-Key)`);
    console.log(`  GET  /admin/stats       – Dashboard stats (requires X-Admin-Key)\n`);
  });
}

module.exports = app;
