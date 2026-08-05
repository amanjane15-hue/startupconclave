# Next-Start Up Conclave 2026 — Setup Guide

## How emails work (no server needed!)

The site uses **EmailJS** — a free service that sends emails directly from the browser.  
You don't need to run any server or install anything.

---

## Step-by-step EmailJS setup (5 minutes)

### 1. Create a free account
Go to **https://emailjs.com** → Sign Up (free tier = 200 emails/month)

### 2. Add an Email Service
- Dashboard → **Email Services** → Add New Service
- Choose Gmail (or any provider)
- Connect your event email account (e.g. info@nexus.com)
- Copy the **Service ID** (looks like `service_xxxxxxx`)

### 3. Create Template 1 — Registration Confirmation
- Dashboard → **Email Templates** → Create New Template
- Set **To Email** field to: `{{to_email}}`
- Subject: `Registration Confirmed – Next-Start Up Conclave 2026`
- Body (use these exact variable names):

```
Hi {{to_name}},

Your registration is confirmed!

College: {{college}}
Ticket: {{ticket}}
Phone: {{phone}}
Event: {{event_date}}
Venue: {{venue}}

See you there!
— The Conclave Team
```
- Save and copy the **Template ID** (looks like `template_xxxxxxx`)

### 4. Create Template 2 — Contact Form
- Create another template
- Set **To Email** to your admin email (hardcode it or use a variable)
- Subject: `[Contact] {{subject}}`
- Body:

```
From: {{from_name}} <{{from_email}}>
Subject: {{subject}}

{{message}}
```
- Save and copy this **Template ID**

### 5. Get your Public Key
- Dashboard → **Account** → **Public Key** (looks like `xxxxxxxxxxxxxxxxxxxx`)

### 6. Paste your keys into app.js

Open `app.js` and replace the four placeholders at the top:

```js
const EMAILJS_PUBLIC_KEY       = 'your_actual_public_key';
const EMAILJS_SERVICE_ID       = 'service_xxxxxxx';
const EMAILJS_REG_TEMPLATE     = 'template_xxxxxxx';   // registration template
const EMAILJS_CONTACT_TEMPLATE = 'template_yyyyyyy';   // contact template
```

### 7. Open index.html in your browser — done!

---

## College email domains supported
`.edu` `.ac.in` `.edu.in` `.ac.uk` `.ac.nz` `.ac.za` `.edu.au` `.ac.jp` `.edu.sg` `.ac.ae` `.edu.hk`

To add more, edit the `COLLEGE_DOMAINS` array in `app.js`.

---

## Demo / testing mode
If you haven't set up EmailJS yet, the forms still work — they'll show success messages and log to the browser console instead of actually sending emails. Great for testing the UI first.

---

## Optional: Node.js backend (for admin notifications)
If you also want to blast event update emails to all subscribers, use the included `server.js`:
```bash
npm install
cp .env.example .env   # fill in your Gmail SMTP credentials
node server.js
```
Then use the `/admin/notify` endpoint (see README in server.js for details).
