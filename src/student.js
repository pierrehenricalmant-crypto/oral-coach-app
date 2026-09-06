import { identifyStudent, getUnits, createSession, sendCoachMessage, endSession } from './api.js';

const level = sessionStorage.getItem('oralCoach.level');
const teacherCode = sessionStorage.getItem('oralCoach.teacherCode');

if (!level || !teacherCode) {
  window.location.href = import.meta.env.BASE_URL;
}

document.getElementById('context-line').textContent = `${level} — ${teacherCode}`;
document.getElementById('btn-back').addEventListener('click', () => {
  sessionStorage.removeItem('oralCoach.level');
  sessionStorage.removeItem('oralCoach.teacherCode');
  window.location.href = import.meta.env.BASE_URL;
});

// ---- Sections ----
const identifySection = document.getElementById('identify-section');
const unitsSection = document.getElementById('units-section');
const workspaceSection = document.getElementById('workspace-section');
const reportSection = document.getElementById('report-section');

function showOnly(section) {
  for (const s of [identifySection, unitsSection, workspaceSection, reportSection]) {
    s.hidden = s !== section;
  }
}

// ---- State ----
let student = null;
let units = [];
let selectedUnit = null;
let currentSession = null;

// ---- Step A: identify ----
const identifyForm = document.getElementById('identify-form');
const identifyError = document.getElementById('identify-error');

identifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const firstName = document.getElementById('first-name').value.trim();
  const lastInitial = document.getElementById('last-initial').value.trim();

  if (!firstName) {
    identifyError.textContent = 'Entre ton prénom.';
    identifyError.classList.add('visible');
    return;
  }

  try {
    student = await identifyStudent({ level, teacherCode, firstName, lastInitial });
    document.getElementById('student-name-line').textContent = student.firstName;
    await loadUnits();
    showOnly(unitsSection);
  } catch (err) {
    identifyError.textContent = "Impossible de te connecter, réessaie.";
    identifyError.classList.add('visible');
  }
});

// ---- Step B: unit picker ----
async function loadUnits() {
  const data = await getUnits(level);
  units = data.units;
  const grid = document.getElementById('units-grid');
  grid.innerHTML = '';

  const typeLabels = { unit: null, skill: '📊 Compétence', book_project: '📚 Projet lecture' };

  units.forEach((unit) => {
    const badge = typeLabels[unit.type] || (/^[0-9]+[A-Z]?$/.test(unit.id) ? `Unit ${unit.id}` : null);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'unit-button';
    btn.setAttribute('role', 'listitem');
    btn.innerHTML = `${badge ? `<span class="unit-button__id">${badge}</span>` : ''}<span class="unit-button__title">${unit.title}</span>`;
    btn.addEventListener('click', () => selectUnit(unit));
    grid.appendChild(btn);
  });
}

function selectUnit(unit) {
  selectedUnit = unit;
  currentSession = null;

  const isPlainUnit = /^[0-9]+[A-Z]?$/.test(unit.id);
  document.getElementById('unit-title').textContent = isPlainUnit ? `Unit ${unit.id} — ${unit.title}` : unit.title;
  document.getElementById('unit-details').innerHTML = `
    <p><strong>Tu vas être capable de :</strong></p>
    <ul>${unit.canDo.map((c) => `<li>${c}</li>`).join('')}</ul>
    <p><strong>Grammaire :</strong> ${unit.grammar.join(', ')}</p>
  `;

  document.getElementById('chat-panel').hidden = true;
  document.getElementById('btn-start-chat').hidden = false;
  document.getElementById('chat-log').innerHTML = '';

  showOnly(workspaceSection);
}

document.getElementById('btn-change-unit').addEventListener('click', () => showOnly(unitsSection));

// ---- Step C: chat + recording ----
const chatPanel = document.getElementById('chat-panel');
const chatLog = document.getElementById('chat-log');
const btnStartChat = document.getElementById('btn-start-chat');
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const recordingIndicator = document.getElementById('recording-indicator');
const textFallbackForm = document.getElementById('text-fallback-form');
const textFallbackInput = document.getElementById('text-fallback-input');

function appendBubble(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${role}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;

  if (role === 'assistant') speakCoachReply(text);
}

// The coach speaks its replies aloud (prosody/pronunciation matter for an
// oral-practice app) via the browser's built-in speech synthesis — no
// third-party TTS service, consistent with how recording works. The text
// bubble stays too: written corrections (bold words, spelling) are easier
// to review by eye than to catch by ear alone.

// Browsers ship several English voices of very different quality — the
// default pick is often the flattest/most robotic one. Prefer the more
// natural-sounding ones (Chrome's "Google" voices, Edge's "Online/Natural"
// neural voices, Safari's "Enhanced/Premium" ones) when available.
let cachedVoices = [];
function refreshVoices() {
  cachedVoices = window.speechSynthesis?.getVoices() || [];
}
if (window.speechSynthesis) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function pickBestEnglishVoice() {
  const englishVoices = cachedVoices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  if (englishVoices.length === 0) return null;

  const rank = (voice) => {
    const name = voice.name.toLowerCase();
    if (name.includes('google')) return 4;
    if (name.includes('online') || name.includes('natural')) return 3;
    if (name.includes('enhanced') || name.includes('premium')) return 2;
    if (voice.lang.toLowerCase() === 'en-us' || voice.lang.toLowerCase() === 'en-gb') return 1;
    return 0;
  };

  return englishVoices.sort((a, b) => rank(b) - rank(a))[0];
}

function speakCoachReply(text) {
  if (!window.speechSynthesis) return;

  const spoken = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/\*(.*?)\*/g, '$1') // *italic*
    .replace(/[#>_~`]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // emoji
    .trim();
  if (!spoken) return;

  window.speechSynthesis.cancel(); // don't overlap with a reply still playing
  const utterance = new SpeechSynthesisUtterance(spoken);
  const voice = pickBestEnglishVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-US';
  }
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

btnStartChat.addEventListener('click', async () => {
  currentSession = await createSession(selectedUnit.id);
  chatPanel.hidden = false;
  btnStartChat.hidden = true;
  appendBubble('assistant', `Hello! Ready to talk about "${selectedUnit.title}"? Click the microphone and start speaking — or type below if you prefer.`);
});

async function handleStudentMessage(text) {
  if (!text.trim() || !currentSession) return;
  appendBubble('user', text);
  try {
    const { reply } = await sendCoachMessage(currentSession.id, text);
    appendBubble('assistant', reply);
  } catch (err) {
    appendBubble('assistant', "(Le coach n'a pas pu répondre, réessaie.)");
  }
}

textFallbackForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = textFallbackInput.value;
  textFallbackInput.value = '';
  handleStudentMessage(text);
});

// ---- Voice recording via the browser's Web Speech API ----
// No third-party transcription service: recognition runs in the browser.
// Safari support is inconsistent, so the text field above always works as
// a fallback (also useful for accessibility).
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognitionImpl) {
  recognition = new SpeechRecognitionImpl();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join(' ');
    handleStudentMessage(transcript);
  };

  recognition.onerror = () => {
    appendBubble('assistant', "(Je n'ai pas bien entendu — réessaie, ou écris ta réponse ci-dessous.)");
  };

  recognition.onend = () => {
    btnRecord.hidden = false;
    btnRecord.setAttribute('aria-pressed', 'false');
    btnStop.hidden = true;
    recordingIndicator.hidden = true;
  };
} else {
  btnRecord.disabled = true;
  btnRecord.title = "Reconnaissance vocale non disponible sur ce navigateur — utilise le champ texte.";
}

btnRecord.addEventListener('click', () => {
  if (!recognition) return;
  window.speechSynthesis?.cancel(); // don't talk over the student
  recognition.start();
  btnRecord.hidden = true;
  btnRecord.setAttribute('aria-pressed', 'true');
  btnStop.hidden = false;
  recordingIndicator.hidden = false;
});

btnStop.addEventListener('click', () => {
  if (!recognition) return;
  recognition.stop();
});

// ---- End of session -> report ----
document.getElementById('btn-end-session').addEventListener('click', async () => {
  if (!currentSession) return;
  const finished = await endSession(currentSession.id);
  renderReport(finished.report);
  showOnly(reportSection);
});

function renderReport(report) {
  const el = document.getElementById('report-content');
  if (!report) {
    el.innerHTML = '<p>Rapport indisponible.</p>';
    return;
  }
  const errorLabels = { grammar: 'Grammaire', vocabulary: 'Vocabulaire', prosody: 'Prosodie', pronunciation: 'Prononciation' };

  el.innerHTML = `
    <p>${report.summary || ''}</p>
    ${report.strengths?.length ? `<h3>Points forts</h3><ul>${report.strengths.map((s) => `<li>${s}</li>`).join('')}</ul>` : ''}
    ${report.errors?.length ? `<h3>À travailler</h3><ul>${report.errors.map((e) => `<li><strong>${errorLabels[e.category] || e.category}${e.subcategory ? ` — ${e.subcategory}` : ''} :</strong> ${e.detail}</li>`).join('')}</ul>` : ''}
    ${report.advice?.length ? `<h3>Conseils</h3><ul>${report.advice.map((a) => `<li>${a}</li>`).join('')}</ul>` : ''}
  `;
}

document.getElementById('btn-new-unit').addEventListener('click', () => showOnly(unitsSection));
