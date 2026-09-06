import { teacherLogin } from './api.js';

const form = document.getElementById('login-form');
const levelSelect = document.getElementById('level');
const teacherSelect = document.getElementById('teacher');
const btnStudent = document.getElementById('btn-student');
const btnTeacher = document.getElementById('btn-teacher');
const teacherPanel = document.getElementById('teacher-panel');
const teacherPasswordInput = document.getElementById('teacher-password');
const btnTeacherSubmit = document.getElementById('btn-teacher-submit');
const errorMessage = document.getElementById('error-message');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('visible');
}

function requireLevelAndTeacher() {
  if (!levelSelect.value || !teacherSelect.value) {
    showError('Choisis d’abord ta classe et ton professeur.');
    return false;
  }
  clearError();
  return true;
}

btnStudent.addEventListener('click', () => {
  if (!requireLevelAndTeacher()) return;

  // No password for students: the first-name step happens on the student
  // page itself (kept minimal here, per the RGPD-conscious identifier).
  sessionStorage.setItem('oralCoach.level', levelSelect.value);
  sessionStorage.setItem('oralCoach.teacherCode', teacherSelect.value);
  window.location.href = `${import.meta.env.BASE_URL}student.html`;
});

btnTeacher.addEventListener('click', () => {
  if (!requireLevelAndTeacher()) return;

  const isOpen = teacherPanel.classList.toggle('open');
  teacherPanel.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) teacherPasswordInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireLevelAndTeacher()) return;

  const password = teacherPasswordInput.value;
  if (!password) {
    showError('Entre ton mot de passe.');
    return;
  }

  btnTeacherSubmit.disabled = true;
  clearError();

  try {
    await teacherLogin(teacherSelect.value, password);
    sessionStorage.setItem('oralCoach.level', levelSelect.value);
    window.location.href = '/teacher.html';
  } catch (err) {
    // Distinguish "wrong password" from "server/database unreachable" —
    // showing the wrong one of these to a teacher is actively misleading.
    showError(err.message === 'Invalid credentials.' ? 'Mot de passe incorrect.' : "Le serveur est indisponible, réessaie.");
  } finally {
    btnTeacherSubmit.disabled = false;
  }
});
