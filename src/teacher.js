import { getTeacherMe, teacherLogout, getDashboard, getUnits } from './api.js';

const initialLevel = sessionStorage.getItem('oralCoach.level') || '';
const levelFilter = document.getElementById('level-filter');
const emptyState = document.getElementById('empty-state');
const table = document.getElementById('dashboard-table');
const tbody = document.getElementById('dashboard-body');

const CATEGORY_LABELS = {
  grammar: 'Grammaire',
  vocabulary: 'Vocabulaire',
  prosody: 'Prosodie',
  pronunciation: 'Prononciation',
};

// Cache of "how many units exist for this level" — used to compute each
// student's progression fraction. Fetched lazily as levels come up.
const unitTotalsCache = {};

async function getUnitTotal(level) {
  if (!(level in unitTotalsCache)) {
    try {
      const { units } = await getUnits(level);
      unitTotalsCache[level] = units.length;
    } catch {
      unitTotalsCache[level] = null;
    }
  }
  return unitTotalsCache[level];
}

const MAX_ERROR_BADGES = 4;

function renderErrorBadges(topErrors) {
  if (!topErrors?.length) return '<span class="hint">—</span>';
  return topErrors
    .slice(0, MAX_ERROR_BADGES)
    .map((e) => {
      const label = CATEGORY_LABELS[e.category] || e.category;
      const title = e.subcategory ? `${label} — ${e.subcategory}` : label;
      return `<span class="error-badge" title="${title}">${title} (${e.count})</span>`;
    })
    .join(' ');
}

async function renderDashboard() {
  const level = levelFilter.value;
  const { students } = await getDashboard(level || undefined);

  if (students.length === 0) {
    table.hidden = true;
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  table.hidden = false;
  tbody.innerHTML = '';

  for (const student of students) {
    const total = await getUnitTotal(student.level);
    const fraction = total ? `${student.unitsTested}/${total}` : `${student.unitsTested}`;
    const percent = total ? Math.round((student.unitsTested / total) * 100) : 0;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.firstName}${student.lastInitial ? ' ' + student.lastInitial + '.' : ''}</td>
      <td>${student.level}</td>
      <td>
        <div class="progress-bar"><div class="progress-bar__fill" style="width: ${percent}%"></div></div>
        <span class="hint">${fraction}</span>
      </td>
      <td>${student.unitsTested}</td>
      <td>${renderErrorBadges(student.topErrors)}</td>
    `;
    tbody.appendChild(row);
  }
}

levelFilter.value = initialLevel;
levelFilter.addEventListener('change', renderDashboard);

getTeacherMe()
  .then(({ code }) => {
    document.getElementById('context-line').textContent = code;
    return renderDashboard();
  })
  .catch(() => {
    window.location.href = '/index.html';
  });

document.getElementById('btn-logout').addEventListener('click', async () => {
  try {
    await teacherLogout();
  } finally {
    sessionStorage.removeItem('oralCoach.level');
    window.location.href = '/index.html';
  }
});
