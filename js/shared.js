const RAVA_PROFILE_INDEX = 'ravaProfiles';
const RAVA_ACTIVE_PROFILE = 'ravaActiveProfileId';

function readProfileIndex() {
  try {
    const value = JSON.parse(localStorage.getItem(RAVA_PROFILE_INDEX));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function profileIdentity(profile) {
  return [profile.fullName, profile.university, profile.course]
    .map((value) => String(value || '').trim().toLocaleLowerCase())
    .join('|');
}

function getActiveProfile() {
  const id = localStorage.getItem(RAVA_ACTIVE_PROFILE);
  return id ? readProfileIndex()[id] || null : null;
}

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'Guest';
}

function saveProfile(profile, createNew = false) {
  const profiles = readProfileIndex();
  const current = getActiveProfile();
  const identity = profileIdentity(profile);
  const matchingProfile = Object.values(profiles).find((entry) => profileIdentity(entry.profile || {}) === identity);
  const id = createNew
    ? `rava-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`
    : current && profileIdentity(current.profile || {}) === identity
      ? current.id
      : matchingProfile?.id || `rava-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
  const existing = profiles[id] || {};
  const oldDetails = existing.profile || {};
  const assessmentContextChanged = oldDetails.yearOfStudy !== profile.yearOfStudy;
  const previousHistoryChanged = JSON.stringify(oldDetails.previousSemester || {}) !== JSON.stringify(profile.previousSemester || {});

  profiles[id] = {
    ...existing,
    id,
    profile: { ...profile },
    profileSaved: true,
    units: assessmentContextChanged ? [] : Array.isArray(existing.units) ? existing.units : [],
    quizAnswers: assessmentContextChanged ? {} : existing.quizAnswers || {},
    currentSemester: assessmentContextChanged ? {} : existing.currentSemester || {},
    assessmentComplete: assessmentContextChanged ? false : Boolean(existing.assessmentComplete),
    reportGenerated: assessmentContextChanged || previousHistoryChanged ? false : Boolean(existing.reportGenerated)
  };

  try {
    localStorage.setItem(RAVA_PROFILE_INDEX, JSON.stringify(profiles));
    localStorage.setItem(RAVA_ACTIVE_PROFILE, id);
    return profiles[id];
  } catch {
    return null;
  }
}

function updateActiveProfile(updates) {
  const current = getActiveProfile();
  if (!current) return null;
  const profiles = readProfileIndex();
  const updated = { ...current, ...updates };
  profiles[current.id] = updated;
  try {
    localStorage.setItem(RAVA_PROFILE_INDEX, JSON.stringify(profiles));
    return updated;
  } catch {
    return null;
  }
}

function calculateWorkflowProgress(profile) {
  if (!profile?.profileSaved) return 0;
  if (!profile.assessmentComplete) return 33;
  if (!profile.reportGenerated) return 67;
  return 100;
}

function renderWorkflowProgress() {
  const profile = getActiveProfile();
  const progress = calculateWorkflowProgress(profile);
  const fill = document.getElementById('workflowProgressFill');
  const bar = document.getElementById('workflowProgressBar');
  const percent = document.getElementById('workflowProgressPercent');
  const message = document.getElementById('workflowProgressText');

  if (fill) fill.style.width = `${progress}%`;
  if (bar) {
    bar.setAttribute('aria-valuenow', String(progress));
    bar.setAttribute('aria-label', `${progress} percent complete`);
  }
  if (percent) percent.textContent = `${progress}%`;
  if (message) {
    message.textContent = progress === 100
      ? 'Complete · Your report is ready to save as a PDF'
      : `Step ${Math.floor(progress / 33) + 1} of 3 · ${progress === 0 ? 'Save your profile and previous semester' : progress === 33 ? 'Complete the assessment' : 'Generate your findings report'}`;
  }
}

function renderProfileHeader() {
  const profile = getActiveProfile()?.profile;
  const name = firstName(profile?.fullName);
  const nameElement = document.getElementById('profileName');
  const avatarElement = document.getElementById('profileAvatar');
  if (nameElement) nameElement.textContent = name;
  if (avatarElement) {
    const initials = name === 'Guest' ? '--' : name[0].toLocaleUpperCase();
    avatarElement.textContent = initials;
  }
}

function renderNavigationNotice(message) {
  const notice = document.getElementById('navigationNotice');
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
}

function renderProfileSwitcher() {
  const picker = document.getElementById('profilePicker');
  const profiles = readProfileIndex();
  const entries = Object.values(profiles).filter((entry) => entry?.profile?.fullName);
  if (picker) picker.hidden = entries.length === 0;

  document.querySelectorAll('.profile-switcher').forEach((select) => {
    select.replaceChildren(new Option(entries.length ? 'Switch profile' : 'No saved profiles', ''));
    entries.forEach((entry) => {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = `${firstName(entry.profile.fullName)} · ${entry.profile.course}`;
      select.appendChild(option);
    });
    select.value = localStorage.getItem(RAVA_ACTIVE_PROFILE) || '';
    select.disabled = entries.length < 2;
    if (!select.dataset.bound) {
      select.addEventListener('change', () => {
        if (!readProfileIndex()[select.value]) return;
        localStorage.setItem(RAVA_ACTIVE_PROFILE, select.value);
        window.location.reload();
      });
      select.dataset.bound = 'true';
    }
  });
}

function guardNavigation() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-required]');
    if (!link) return;
    const profile = getActiveProfile();
    const requirement = link.dataset.required;
    if (requirement === 'profile' && !profile?.profileSaved) {
      event.preventDefault();
      renderNavigationNotice('Save your profile on Home before starting the assessment.');
    } else if (requirement === 'assessment' && !profile?.assessmentComplete) {
      event.preventDefault();
      renderNavigationNotice('Complete all assessment questions and add a valid unit before opening your findings.');
    }
  });
}

window.RavaStore = {
  getActiveProfile,
  firstName,
  saveProfile,
  updateActiveProfile,
  listProfiles: () => Object.values(readProfileIndex()),
  calculateWorkflowProgress,
  renderWorkflowProgress,
  renderProfileSwitcher
};

renderProfileHeader();
renderWorkflowProgress();
renderProfileSwitcher();
guardNavigation();

const currentProfile = getActiveProfile();
const currentPage = document.body.dataset.page;
if (currentPage === 'assessment' && !currentProfile?.profileSaved) {
  window.location.replace('page1.html#profile-form');
} else if (currentPage === 'findings' && !currentProfile?.assessmentComplete) {
  window.location.replace(currentProfile?.profileSaved ? 'page2.html' : 'page1.html#profile-form');
}