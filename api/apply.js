// POST /api/apply — internship application from learn.html#apply-internship.
//
// 1. Emails every detail to the Katxel mailbox (reply-to = the candidate),
//    with a one-row CSV attached for the applications register.
// 2. Emails the candidate an acknowledgement with a copy of what they sent.
// 3. If TRAINING_APPLY_URL and INTAKE_TOKEN are set, forwards the application
//    to the Katxel Training app (training.katxel.in) for its offer-letter inbox.
const m = require('./_lib/mail');

const DOMAINS = { gis: 'GIS', developer: 'CS & IT - Developer', tester: 'CS & IT - Tester', marketing: 'Marketing' };
const MODES = ['Remote', 'Hybrid / Remote', 'Hybrid', 'On-site'];
const DURATIONS = { '1': '1 month', '1.5': '6 weeks', '2': '2 months', '3': '3 months', '6': '6 months' };
const FIELDS = {
  domain: 20, startDate: 10, duration: 4, workMode: 20, title: 4, name: 80, relation: 4, father: 80,
  email: 120, mobile: 16, address: 160, city: 60, state: 60, pin: 6,
  college: 120, course: 100, year: 20, skills: 200, link: 300
};
const REQUIRED = ['domain', 'startDate', 'duration', 'workMode', 'title', 'name', 'relation', 'father',
  'email', 'mobile', 'address', 'city', 'state', 'pin', 'college', 'course', 'year'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const niceDate = (iso) => { const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return x ? `${+x[3]} ${MONTHS[+x[2] - 1]} ${x[1]}` : iso; };

function validate(body) {
  const app = {};
  for (const [k, max] of Object.entries(FIELDS)) app[k] = m.clean(body[k], max);
  app.message = m.cleanText(body.message, 1500);
  const missing = REQUIRED.filter((k) => !app[k]);
  if (missing.length) return { error: 'Please fill in: ' + missing.join(', ') };
  if (!DOMAINS[app.domain]) return { error: 'Please choose an internship domain.' };
  if (!MODES.includes(app.workMode)) return { error: 'Please choose a work mode.' };
  if (!['Mr.', 'Ms.'].includes(app.title) || !['S/o', 'D/o'].includes(app.relation)) return { error: 'Please check the title and relation.' };
  if (!m.EMAIL_RE.test(app.email)) return { error: 'Please enter a valid email address.' };
  app.mobile = app.mobile.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(app.mobile)) return { error: 'Please enter a valid 10-digit mobile number.' };
  if (!/^[1-9]\d{5}$/.test(app.pin)) return { error: 'Please enter a valid 6-digit PIN code.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(app.startDate)) return { error: 'Please enter a valid start date.' };
  if (app.link && !/^https?:\/\//i.test(app.link)) app.link = 'https://' + app.link;
  return { app };
}

function rows(app) {
  return [
    ['Application ID', app.id],
    ['Submitted', m.istTime(app.submittedAt)],
    ['Internship', DOMAINS[app.domain]],
    ['Preferred start', niceDate(app.startDate)],
    ['Duration', DURATIONS[app.duration] || app.duration + ' months'],
    ['Work mode', app.workMode],
    ['Name', `${app.title} ${app.name}`],
    [app.relation, app.father],
    ['Email', app.email],
    ['Mobile', '+91 ' + app.mobile],
    ['Address', `${app.address}, ${app.city}, ${app.state} - ${app.pin}`],
    ['College', app.college],
    ['Course', `${app.course} (${app.year})`],
    ['Skills', app.skills],
    ['Resume / LinkedIn', app.link],
    ['Why this internship', app.message]
  ];
}

function teamMail(app) {
  const r = rows(app);
  const domain = DOMAINS[app.domain];
  return {
    from: m.from('Katxel Website'),
    to: m.teamAddresses(),
    replyTo: { name: app.name, address: app.email },
    subject: `Internship application: ${app.name} - ${domain} (${app.id})`,
    html: m.page([`<b>${m.esc(app.title + ' ' + app.name)}</b> applied for the <b>${m.esc(domain)}</b> internship.`], r,
      ['Press <b>Reply</b> to answer the candidate directly. The attached CSV row can be pasted into your applications register.']),
    text: `${app.title} ${app.name} applied for the ${domain} internship.\n\n${m.textTable(r)}\n\nReply to this email to answer the candidate directly.\n`,
    attachments: [{ filename: `${app.id}.csv`, content: m.csv(r), contentType: 'text/csv; charset=utf-8' }]
  };
}

function candidateMail(app) {
  const r = rows(app).filter(([k]) => k !== 'Submitted');
  const first = app.name.split(' ')[0];
  const domain = DOMAINS[app.domain];
  const team = m.teamAddresses()[0];
  return {
    from: m.from('Katxel Learn'),
    to: { name: app.name, address: app.email },
    replyTo: team,
    subject: `We've received your internship application (${app.id})`,
    html: m.page([
      `Dear ${m.esc(first)},`,
      `Thank you for applying for the <b>${m.esc(domain)}</b> internship at Katxel. These are the details we received. ` +
      'Your name and your father\'s name will be printed on your offer letter and certificate exactly as shown, so if anything is wrong, just reply to this email with the correction.'
    ], r, ['We review applications within three business days and will email your offer letter if you are selected.', 'Warm regards,<br>Katxel Learn team']),
    text: `Dear ${first},\n\nThank you for applying for the ${domain} internship at Katxel. These are the details we received. ` +
      'Your name and your father\'s name will be printed on your offer letter and certificate exactly as shown, so if anything is wrong, just reply to this email with the correction.\n\n' +
      m.textTable(r) + '\n\nWe review applications within three business days and will email your offer letter if you are selected.\n\nWarm regards,\nKatxel Learn team\n'
  };
}

async function forwardToTrainingApp(app) {
  const url = process.env.TRAINING_APPLY_URL, token = process.env.INTAKE_TOKEN;
  if (!url || !token) return 'skipped';
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(app),
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return 'stored';
  } catch (e) {
    console.error('Forward to training app failed:', e.message);
    return 'error: ' + e.message;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return m.reply(res, 405, { error: 'Method not allowed' }); }
  const body = m.readBody(req);
  if (!body) return m.reply(res, 400, { error: 'Invalid request.' });
  if (m.tooFast(body)) return m.reply(res, 201, { ok: true, id: 'KL-0' }); // bot: pretend success
  const ip = m.clientIp(req);
  if (m.throttled(ip)) return m.reply(res, 429, { error: 'Too many applications from your network. Please try again in an hour.' });

  const { app, error } = validate(body);
  if (error) return m.reply(res, 400, { error });

  const now = new Date();
  app.id = m.refId('KL', now);
  app.submittedAt = now.toISOString();
  app.ip = ip;

  const [team, candidate, stored] = await Promise.all([m.send(teamMail(app)), m.send(candidateMail(app)), forwardToTrainingApp(app)]);
  console.log('application', app.id, { team, candidate, stored });

  // Without the team email or the training-app copy the application would be lost:
  // report failure so the browser falls back to opening a pre-filled email.
  if (!m.ok(team) && stored !== 'stored') return m.reply(res, 503, { error: 'Could not deliver the application.' });
  return m.reply(res, 201, { ok: true, id: app.id, emailed: m.ok(candidate) });
};

module.exports.validate = validate;
