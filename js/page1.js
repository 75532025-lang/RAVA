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
const profileFieldNames = ['fullName', 'university', 'course', 'yearOfStudy', 'previousStudyYear', 'previousAcademicYear'];
const profileFields = {
  ...Object.fromEntries(profileFieldNames.map((name) => [name, document.getElementById(name)])),
  previousSemester: document.getElementById('previousSemester')
};
const activeProfile = window.RavaStore.getActiveProfile();
let previousUnits = normalizePreviousUnits(activeProfile?.profile?.previousSemester?.units);
let createNewProfile = false;

function normalizePreviousUnits(units) {
  if (!Array.isArray(units)) return [];
  return units.filter((unit) => unit && typeof unit.name === 'string' && Number.isFinite(Number(unit.grade)) && Number(unit.grade) >= 0 && Number(unit.grade) <= 100)
    .map((unit) => ({ name: unit.name.trim(), grade: Number(unit.grade) }))
    .filter((unit) => unit.name);
}

function readProfileForm() {
  return {
    ...Object.fromEntries(profileFieldNames.map((name) => [name, profileFields[name].value.trim()])),
    previousSemester: {
      studyYear: profileFields.previousStudyYear.value.trim(),
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
  return profileFieldNames.every((name) => profile[name] === current[name]) &&
    JSON.stringify(profile.previousSemester || {}) === JSON.stringify(current.previousSemester);
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
    gradeCell.textContent = `${unit.grade}%`;
    removeButton.type = 'button';
    removeButton.className = 'remove-previous-unit';
    removeButton.dataset.index = String(index);
    removeButton.setAttribute('aria-label', `Remove ${unit.name} from previous semester`);
    removeButton.textContent = 'Remove';
    actionCell.appendChild(removeButton);
    row.append(nameCell, gradeCell, actionCell);
    previousUnitsBody.appendChild(row);
  });

  const average = previousUnits.reduce((total, unit) => total + unit.grade, 0) / previousUnits.length;
  previousUnitsSummary.textContent = `${previousUnits.length} ${previousUnits.length === 1 ? 'unit' : 'units'} · ${average.toFixed(1)}% average`;
}

function addPreviousUnit() {
  const name = previousUnitNameInput.value.trim();
  const grade = Number(previousUnitGradeInput.value);
  if (!name || previousUnitGradeInput.value === '' || !Number.isFinite(grade) || grade < 0 || grade > 100) {
    previousUnitsStatus.textContent = 'Enter a unit name and a grade from 0 to 100.';
    return;
  }

  previousUnits.push({ name, grade });
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
  profileStatus.textContent = `Saved for ${profile.profile.fullName}, including previous-semester details.`;
  createNewProfile = false;
  window.RavaStore.renderProfileSwitcher();
  window.RavaStore.renderWorkflowProgress();
  document.getElementById('profileName').textContent = profile.profile.fullName;
  const initials = profile.profile.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase();
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
  { text: 'Turn your answers into findings, recommendations, and a clear next step.', link: 'View resources', href: 'page3.html#recommendations', required: 'assessment' }
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