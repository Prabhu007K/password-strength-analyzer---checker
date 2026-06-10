const CHAR_SETS = [
  { re: /[a-z]/, bits: 26, label: 'lowercase', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { re: /[A-Z]/, bits: 26, label: 'uppercase', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { re: /[0-9]/, bits: 10, label: 'numbers', chars: '0123456789' },
  { re: /[^a-zA-Z0-9]/, bits: 32, label: 'symbols', chars: '!@#$%^&*()-_=+[]{}|;:,.<>?' },
];

const GUESSES_PER_SEC = 1e10; // 10 billion guesses/sec (offline hash cracking estimate)

function calcEntropy(pw) {
  if (!pw) return 0;
  let pool = 0;
  CHAR_SETS.forEach(s => { if (s.re.test(pw)) pool += s.bits; });
  return pool ? Math.round(pw.length * Math.log2(pool)) : 0;
}

function estimateCrackTime(entropyBits) {
  if (entropyBits <= 0) return 'Instantly crackable';
  const log10Seconds = (entropyBits - 1) * Math.log10(2) - Math.log10(2 * GUESSES_PER_SEC);
  if (log10Seconds < 0) return 'Less than 1 second (at 10B guesses/sec)';
  if (log10Seconds > 18) return 'Centuries+ — effectively uncrackable';
  const seconds = Math.pow(10, log10Seconds);
  return `~${formatDuration(seconds)} to crack (avg., 10B guesses/sec)`;
}

function formatDuration(seconds) {
  const units = [
    { s: 31536000, label: 'year' },
    { s: 86400, label: 'day' },
    { s: 3600, label: 'hour' },
    { s: 60, label: 'minute' },
    { s: 1, label: 'second' },
  ];
  for (const u of units) {
    if (seconds >= u.s) {
      const val = Math.round(seconds / u.s);
      return `${val.toLocaleString()} ${u.label}${val !== 1 ? 's' : ''}`;
    }
  }
  return 'less than a second';
}

function analyze(pw) {
  const checks = [
    { label: 'At least 8 characters', pass: pw.length >= 8 },
    { label: 'At least 12 characters', pass: pw.length >= 12 },
    { label: 'Contains uppercase letter', pass: /[A-Z]/.test(pw) },
    { label: 'Contains lowercase letter', pass: /[a-z]/.test(pw) },
    { label: 'Contains a number', pass: /[0-9]/.test(pw) },
    { label: 'Contains a symbol', pass: /[^a-zA-Z0-9]/.test(pw) },
    { label: 'No common patterns (123, abc)', pass: !/(123|abc|password|qwerty)/i.test(pw) },
  ];
  const entropy = calcEntropy(pw);
  let score, label, color;
  if (entropy < 28) { score = 20; label = 'Very Weak'; color = '#ef4444'; }
  else if (entropy < 36) { score = 40; label = 'Weak'; color = '#f97316'; }
  else if (entropy < 60) { score = 65; label = 'Fair'; color = '#f59e0b'; }
  else if (entropy < 80) { score = 85; label = 'Strong'; color = '#84cc16'; }
  else { score = 100; label = 'Very Strong'; color = '#10b981'; }
  return { checks, entropy, score, label, color };
}

function randomChar(charset) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

function shuffle(str) {
  const a = str.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join('');
}

function generatePassword(length, opts) {
  const active = CHAR_SETS.filter(s => opts[s.label]);
  if (!active.length) return null;

  let pw = active.map(s => randomChar(s.chars)).join('');
  const allChars = active.map(s => s.chars).join('');
  while (pw.length < length) pw += randomChar(allChars);
  return shuffle(pw.slice(0, length));
}

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function checkHIBP(password) {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!res.ok) throw new Error('API unavailable');
  const text = await res.text();
  for (const line of text.split('\n')) {
    const [hashSuffix, count] = line.split(':');
    if (hashSuffix === suffix) return parseInt(count, 10);
  }
  return 0;
}

let debounceTimer;
let currentMode = 'checker';
let breachRequestId = 0;

const input = document.getElementById('password');
const genOutput = document.getElementById('gen-output');
const results = document.getElementById('results');
const strengthBar = document.getElementById('strength-bar');
const liveBar = document.getElementById('live-bar');
const liveBarWrap = document.getElementById('live-bar-wrap');

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

document.getElementById('toggle-vis').addEventListener('click', () => {
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('clear-pw').addEventListener('click', () => {
  input.value = '';
  input.type = 'password';
  results.hidden = true;
  liveBarWrap.hidden = true;
});

document.getElementById('gen-length').addEventListener('input', e => {
  document.getElementById('gen-length-val').textContent = e.target.value;
});

document.getElementById('gen-btn').addEventListener('click', () => {
  const length = +document.getElementById('gen-length').value;
  const opts = {
    lowercase: document.getElementById('gen-lower').checked,
    uppercase: document.getElementById('gen-upper').checked,
    numbers: document.getElementById('gen-numbers').checked,
    symbols: document.getElementById('gen-symbols').checked,
  };
  const pw = generatePassword(length, opts);
  if (!pw) {
    alert('Select at least one character type.');
    return;
  }
  genOutput.value = pw;
  runAnalysis(pw);
});

document.getElementById('copy-pw').addEventListener('click', async () => {
  const pw = genOutput.value;
  if (!pw) return;
  try {
    await navigator.clipboard.writeText(pw);
    const btn = document.getElementById('copy-pw');
    btn.classList.add('copied');
    btn.title = 'Copied!';
    setTimeout(() => { btn.classList.remove('copied'); btn.title = 'Copy'; }, 1500);
  } catch {
    genOutput.select();
    document.execCommand('copy');
  }
});

input.addEventListener('input', () => {
  const pw = input.value;
  updateLiveBar(pw);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runAnalysis(pw), 350);
});

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  document.getElementById('panel-checker').classList.toggle('hidden', mode !== 'checker');
  document.getElementById('panel-generator').classList.toggle('hidden', mode !== 'generator');
  document.getElementById('header-sub').textContent = mode === 'checker'
    ? 'Real-time entropy scoring & Have I Been Pwned breach check (k-anonymity)'
    : 'Generate a strong password and analyze it instantly';

  if (mode === 'checker') {
    if (input.value) runAnalysis(input.value);
    else { results.hidden = true; liveBarWrap.hidden = true; }
  } else if (genOutput.value) {
    runAnalysis(genOutput.value);
  } else {
    results.hidden = true;
  }
}

function updateLiveBar(pw) {
  if (currentMode !== 'checker' || !pw) {
    liveBarWrap.hidden = true;
    return;
  }
  liveBarWrap.hidden = false;
  const { score, color } = analyze(pw);
  liveBar.style.width = score + '%';
  liveBar.style.background = color;
}

function pulseBar(pwned) {
  strengthBar.classList.remove('pulse', 'pwned-flash');
  void strengthBar.offsetWidth;
  strengthBar.classList.add(pwned ? 'pwned-flash' : 'pulse');
}

function renderResults(pw, { checks, entropy, score, label, color }) {
  results.hidden = false;
  strengthBar.style.width = score + '%';
  strengthBar.style.background = color;
  document.getElementById('strength-label').textContent = label;
  document.getElementById('strength-label').style.color = color;
  document.getElementById('entropy').textContent = `Entropy: ~${entropy} bits`;
  document.getElementById('crack-time').textContent = estimateCrackTime(entropy);
  document.getElementById('checks').innerHTML = checks.map(c =>
    `<li class="${c.pass ? 'pass' : 'fail'}">${c.label}</li>`).join('');
  pulseBar(false);
}

async function runAnalysis(pw) {
  if (!pw) { results.hidden = true; return; }

  const analysis = analyze(pw);
  renderResults(pw, analysis);

  const reqId = ++breachRequestId;
  const status = document.getElementById('breach-status');
  status.className = 'breach-loading';
  status.textContent = 'Checking Have I Been Pwned…';

  try {
    const count = await checkHIBP(pw);
    if (reqId !== breachRequestId) return;
    if (count > 0) {
      status.className = 'breach-pwned';
      status.textContent = `Found in ${count.toLocaleString()} known data breach(es). Do not use this password.`;
      pulseBar(true);
    } else {
      status.className = 'breach-safe';
      status.textContent = 'Not found in known breaches.';
    }
  } catch {
    if (reqId !== breachRequestId) return;
    status.className = 'breach-error';
    status.textContent = 'Could not reach breach database (check internet connection).';
  }
}
