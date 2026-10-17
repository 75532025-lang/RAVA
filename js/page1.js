const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const saveDraftButton = document.getElementById('saveDraftBtn');
const continueButton = document.getElementById('continueToPage2Btn');
const newProfileButton = document.getElementById('newProfileBtn');
const previousUnitsBody = document.getElementById('previousUnitsBody');
const previousUnitsSummary = document.getElementById('previousUnitsSummary');
const previousUnitsStatus = document.getElementById('previousUnitsStatus');
const previousUnitNameInput = document.getElementById('previousUnitName');
const previousUnitGradeInput = document.getElementById('previousUnitGrade');
const gradeScaleSelect = document.getElementById('gradeScaleSelect');
const previousGradeHint = document.getElementById('previousGradeHint');
const profileFieldNames = ['fullName', 'university', 'course', 'yearOfStudy', 'previousAcademicYear'];
const profileFields = {
  ...Object.fromEntries(profileFieldNames.map((name) => [name, document.getElementById(name)])),
  previousSemester: document.getElementById('previousSemester')
};
const activeProfile = window.RavaStore.getActiveProfile();
let previousUnits = normalizePreviousUnits(activeProfile?.profile?.previousSemester?.units);
let createNewProfile = false;

function normalizePreviousUnits(units) {
  if (!Array.isArray(units)) return [];
  return units.map((unit) => {
    if (!unit || typeof unit.name !== 'string') return null;
    const type = unit.gradeType || (typeof unit.grade === 'number' ? 'percent' : /^[a-d]$/i.test(String(unit.grade)) ? 'letter' : 'weight');
    const input = type === 'percent' ? `${unit.grade}%` : String(unit.grade ?? '');
    const parsed = parseGrade(input, type);
    return parsed ? { name: unit.name.trim(), grade: parsed.grade, gradeType: parsed.type } : null;
  }).filter((unit) => unit?.name);
}

function parseGrade(value, type) {
  const raw = String(value || '').trim();
  if (type === 'letter') return /^[a-d]$/i.test(raw) ? { grade: raw.toUpperCase(), type } : null;
  const numericText = type === 'percent' && raw.endsWith('%') ? raw.slice(0, -1).trim() : raw;
  if (!/^\d+(?:\.\d+)?$/.test(numericText)) return null;
  const number = Number(numericText);
  if (!Number.isFinite(number)) return null;
  if (type === 'percent') return number <= 100 ? { grade: number, type } : null;
  return type === 'weight' && number >= 0 ? { grade: numericText, type } : null;
}

function updateGradeScale() {
  const copy = {
    percent: ['e.g. 68', 'Enter a percentage from 0 to 100.'],
    letter: ['e.g. A', 'Enter A, B, C, or D.'],
    weight: ['e.g. 1.0', 'Enter a numeric weight, such as 1.0.']
  }[gradeScaleSelect.value];
  previousUnitGradeInput.placeholder = copy[0];
  previousUnitGradeInput.inputMode = gradeScaleSelect.value === 'letter' ? 'text' : 'decimal';
  previousGradeHint.textContent = copy[1];
  previousUnitGradeInput.value = '';
}

function formatGrade(unit) {
  return unit.gradeType === 'percent' ? `${unit.grade}%` : String(unit.grade);
}

function readProfileForm() {
  return {
    ...Object.fromEntries(profileFieldNames.map((name) => [name, profileFields[name].value.trim()])),
    previousSemester: {
      academicYear: profileFields.previousAcademicYear.value.trim(),
      semester: profileFields.previousSemester.value.trim(),
      units: previousUnits.map((unit) => ({ ...unit }))
    }
  };
}

function setProfileForm(profile) {
  profileFieldNames.forEach((name) => {
    if (profileFields[name] && profile[name]) profileFields[name].value = profile[name];
  });
  if (profile.previousSemester?.semester) profileFields.previousSemester.value = profile.previousSemester.semester;
  previousUnits = normalizePreviousUnits(profile.previousSemester?.units);
  renderPreviousUnits();
}

function profileMatchesForm(profile) {
  if (!profile) return false;
  const current = readProfileForm();
  const savedPrevious = { ...(profile.previousSemester || {}) };
  delete savedPrevious.studyYear;
  return profileFieldNames.every((name) => profile[name] === current[name]) &&
    JSON.stringify({ ...savedPrevious, units: normalizePreviousUnits(savedPrevious.units) }) === JSON.stringify(current.previousSemester);
}

function updateDraftState() {
  const unchanged = profileMatchesForm(window.RavaStore.getActiveProfile()?.profile);
  if (continueButton) continueButton.disabled = !unchanged;
  if (!unchanged && saveDraftButton) saveDraftButton.textContent = 'Save Draft';
  if (profileStatus) {
    profileStatus.textContent = unchanged
      ? 'Your profile and previous semester are saved.'
      : 'Save your profile and previous-semester details before continuing.';
  }
}

function renderPreviousUnits() {
  previousUnitsBody.replaceChildren();
  if (!previousUnits.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = 'No previous units added yet.';
    row.appendChild(cell);
    previousUnitsBody.appendChild(row);
    if (previousUnitsSummary) previousUnitsSummary.textContent = 'No previous units added';
    return;
  }

  previousUnits.forEach((unit, index) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const gradeCell = document.createElement('td');
    const actionCell = document.createElement('td');
    const removeButton = document.createElement('button');
    nameCell.textContent = unit.name;
    gradeCell.textContent = formatGrade(unit);
    removeButton.type = 'button';
    removeButton.className = 'remove-previous-unit';
    removeButton.dataset.index = String(index);
    removeButton.setAttribute('aria-label', `Remove ${unit.name} from previous semester`);
    removeButton.textContent = 'Remove';
    actionCell.appendChild(removeButton);
    row.append(nameCell, gradeCell, actionCell);
    previousUnitsBody.appendChild(row);
  });

  const allPercentages = previousUnits.every((unit) => unit.gradeType === 'percent');
  const average = allPercentages ? previousUnits.reduce((total, unit) => total + Number(unit.grade), 0) / previousUnits.length : null;
  previousUnitsSummary.textContent = `${previousUnits.length} ${previousUnits.length === 1 ? 'unit' : 'units'}${average === null ? ' · grades recorded' : ` · ${average.toFixed(1)}% average`}`;
}

function addPreviousUnit() {
  const name = previousUnitNameInput.value.trim();
  const grade = parseGrade(previousUnitGradeInput.value, gradeScaleSelect.value);
  if (!name || !grade) {
    previousUnitsStatus.textContent = `Enter a valid ${gradeScaleSelect.options[gradeScaleSelect.selectedIndex].text.toLowerCase()} grade.`;
    return;
  }

  previousUnits.push({ name, grade: grade.grade, gradeType: grade.type });
  previousUnitNameInput.value = '';
  previousUnitGradeInput.value = '';
  previousUnitsStatus.textContent = `${name} added to previous-semester history.`;
  renderPreviousUnits();
  updateDraftState();
}

const savedProfile = activeProfile?.profile;
if (savedProfile) setProfileForm(savedProfile);
if (continueButton) continueButton.disabled = !activeProfile?.profileSaved || !profileMatchesForm(savedProfile);

profileForm?.addEventListener('input', updateDraftState);
profileForm?.addEventListener('change', updateDraftState);
document.getElementById('addPreviousUnitBtn')?.addEventListener('click', addPreviousUnit);
gradeScaleSelect?.addEventListener('change', updateGradeScale);
updateGradeScale();

previousUnitsBody?.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-previous-unit');
  if (!button) return;
  const index = Number(button.dataset.index);
  if (!Number.isInteger(index) || index < 0 || index >= previousUnits.length) return;
  previousUnits.splice(index, 1);
  renderPreviousUnits();
  previousUnitsStatus.textContent = 'Previous unit removed. Save your changes to keep this update.';
  updateDraftState();
});

profileForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) return;

  const profile = window.RavaStore.saveProfile(readProfileForm(), createNewProfile);
  if (!profile) {
    profileStatus.textContent = 'This browser could not save your profile. Check its storage settings and try again.';
    return;
  }

  if (continueButton) continueButton.disabled = false;
  saveDraftButton.textContent = 'Draft Saved';
  profileStatus.textContent = `Saved for ${window.RavaStore.firstName(profile.profile.fullName)}, including previous-semester details.`;
  createNewProfile = false;
  window.RavaStore.renderProfileSwitcher();
  window.RavaStore.renderWorkflowProgress();
  document.getElementById('profileName').textContent = window.RavaStore.firstName(profile.profile.fullName);
  const initials = window.RavaStore.firstName(profile.profile.fullName)[0].toLocaleUpperCase();
  document.getElementById('profileAvatar').textContent = initials;
});

newProfileButton?.addEventListener('click', () => {
  createNewProfile = true;
  profileForm.reset();
  previousUnits = [];
  renderPreviousUnits();
  previousUnitsStatus.textContent = '';
  if (continueButton) continueButton.disabled = true;
  if (saveDraftButton) saveDraftButton.textContent = 'Save Draft';
  if (profileStatus) profileStatus.textContent = 'Enter details for a new person. Other saved profiles will remain on this device.';
  profileFields.fullName.focus();
});

continueButton?.addEventListener('click', () => {
  const profile = window.RavaStore.getActiveProfile();
  if (!profile?.profileSaved || !profileMatchesForm(profile.profile)) {
    continueButton.disabled = true;
    profileStatus.textContent = 'Save your profile and previous-semester details before continuing.';
    return;
  }
  window.location.href = 'page2.html';
});

const announcements = [
  { text: 'Set up your profile and previous semester to begin.', link: 'Complete profile', href: '#profile-form', required: '' },
  { text: 'Choose unit targets and reflect on the habits shaping your study.', link: 'Open assessment', href: 'page2.html', required: 'profile' },
  { text: 'Turn your answers into findings, recommendations, and a clear next step.', link: 'View report', href: 'page3.html#report-panel', required: 'assessment' }
];

let announcementIndex = 0;
const announcementText = document.getElementById('announcementText');
const announcementLink = document.getElementById('announcementLink');

function renderAnnouncement() {
  const announcement = announcements[announcementIndex];
  announcementText.textContent = announcement.text;
  announcementLink.textContent = `${announcement.link} →`;
  announcementLink.href = announcement.href;
  if (announcement.required) announcementLink.dataset.required = announcement.required;
  else delete announcementLink.dataset.required;
}

document.getElementById('previousAnnouncement')?.addEventListener('click', () => {
  announcementIndex = (announcementIndex + announcements.length - 1) % announcements.length;
  renderAnnouncement();
});

document.getElementById('nextAnnouncement')?.addEventListener('click', () => {
  announcementIndex = (announcementIndex + 1) % announcements.length;
  renderAnnouncement();
});

renderPreviousUnits();
renderAnnouncement();