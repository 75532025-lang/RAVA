const defaultUnits = [
  { name: 'Calculus I', grade: 65 },
  { name: 'Communication Skills', grade: 78 },
  { name: 'Physics', grade: 55 },
  { name: 'Chemistry', grade: 70 }
];

function loadPreviousUnits() {
  try {
    const draft = JSON.parse(localStorage.getItem('ravaAcademicDraft'));
    const storedPreviousUnits = localStorage.getItem('ravaPreviousUnits');
    let savedUnits = draft?.units;
    if (!Array.isArray(savedUnits) || (!savedUnits.length && storedPreviousUnits === null)) {
      savedUnits = storedPreviousUnits ? JSON.parse(storedPreviousUnits) : null;
    }
    if (!Array.isArray(savedUnits)) return defaultUnits;

    return savedUnits.filter((unit) =>
      unit && typeof unit.name === 'string' && unit.name.trim() &&
      Number.isFinite(Number(unit.grade)) && Number(unit.grade) >= 0 && Number(unit.grade) <= 100
    ).map((unit) => ({ name: unit.name.trim(), grade: Number(unit.grade) }));
  } catch {
    return defaultUnits;
  }
}

let previousUnits = loadPreviousUnits();
let gradeMethod = 'Percentage';

const globalGradeMethodSelect = document.getElementById('globalGradeMethodSelect');
const previousUnitsTableBody = document.getElementById('previousUnitsTableBody');
const summaryDisplayText = document.getElementById('summaryDisplayText');
const addPreviousUnitForm = document.getElementById('addPreviousUnitForm');
const continueToPage2Btn = document.getElementById('continueToPage2Btn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const draftStatus = document.getElementById('draftStatus');
const filterYear = document.getElementById('filterYear');
const filterSemester = document.getElementById('filterSemester');
const filterUniversity = document.getElementById('filterUniversity');

try {
  const savedDraft = JSON.parse(localStorage.getItem('ravaAcademicDraft'));
  if (savedDraft) {
    if (filterYear && [...filterYear.options].some((option) => option.value === savedDraft.year)) filterYear.value = savedDraft.year;
    if (filterSemester && [...filterSemester.options].some((option) => option.value === savedDraft.semester)) filterSemester.value = savedDraft.semester;
    if (filterUniversity && [...filterUniversity.options].some((option) => option.value === savedDraft.university)) filterUniversity.value = savedDraft.university;
  }
} catch {
  if (draftStatus) draftStatus.textContent = 'A saved draft could not be read.';
}

function updateProfileDetails() {
  const universityName = filterUniversity?.selectedOptions[0]?.textContent.replace(/\s\([^)]*\)$/, '');
  const universityDisplay = document.getElementById('profileUniversity');
  const yearDisplay = document.getElementById('profileYear');
  const semesterContext = document.getElementById('semesterContext');

  if (universityDisplay && universityName) universityDisplay.textContent = universityName;
  if (yearDisplay && filterYear) yearDisplay.textContent = filterYear.value;
  if (semesterContext && filterYear && filterSemester) {
    semesterContext.textContent = `${filterYear.value} · ${filterSemester.value} · Choose the grading method below.`;
  }
}

function getLetterGrade(grade) {
  if (grade >= 70) return 'A (70–100%)';
  if (grade >= 60) return 'B (60–69%)';
  if (grade >= 50) return 'C (50–59%)';
  if (grade >= 40) return 'D (40–49%)';
  return 'E / Fail (<40%)';
}

function formatGradeValue(unit) {
  if (gradeMethod === 'Percentage') {
    return `${unit.grade} / 100 — ${unit.grade}%`;
  }
  return getLetterGrade(unit.grade);
}

function getGradeBand(grade) {
  if (grade >= 70) return 'grade-strong';
  if (grade >= 50) return 'grade-progressing';
  return 'grade-support';
}

function renderPreviousUnits() {
  if (!previousUnitsTableBody) return;

  previousUnitsTableBody.innerHTML = '';

  if (previousUnits.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 2;
    emptyCell.textContent = 'No units added yet.';
    emptyRow.appendChild(emptyCell);
    previousUnitsTableBody.appendChild(emptyRow);
    renderSummary(0, null, null);
    updateProgress();
    return;
  }

  let total = 0;
  let best = previousUnits[0];
  let lowest = previousUnits[0];

  previousUnits.forEach((unit, index) => {
    const grade = Number(unit.grade) || 0;
    total += grade;
    if (grade > (Number(best.grade) || 0)) best = unit;
    if (grade < (Number(lowest.grade) || 0)) lowest = unit;

    const tr = document.createElement('tr');
    const nameCell = document.createElement('td');
    const gradeCell = document.createElement('td');
    const gradePill = document.createElement('span');
    const removeButton = document.createElement('button');

    nameCell.textContent = unit.name;
    gradeCell.className = 'grade-cell';
    gradePill.className = `grade-pill ${getGradeBand(grade)}`;
    gradePill.textContent = formatGradeValue(unit);
    removeButton.type = 'button';
    removeButton.className = 'remove-btn';
    removeButton.dataset.index = String(index);
    removeButton.textContent = 'Remove';
    gradeCell.append(gradePill, removeButton);
    tr.append(nameCell, gradeCell);
    previousUnitsTableBody.appendChild(tr);
  });

  const avg = (total / previousUnits.length).toFixed(1);
  renderSummary(avg, best, lowest);
  updateProgress();
}

function updateProgress() {
  const progress = document.getElementById('previousUnitsProgress');
  const label = document.getElementById('previousUnitsProgressLabel');
  if (progress) progress.textContent = `Progress: ${Math.min(previousUnits.length * 10, 100)}%`;
  if (label) label.textContent = `${previousUnits.length} ${previousUnits.length === 1 ? 'unit' : 'units'} entered`;
}

function renderSummary(average, best, lowest) {
  if (!summaryDisplayText) return;

  summaryDisplayText.replaceChildren();
  summaryDisplayText.append('Average ');
  appendMetric(average === 0 ? '0%' : `${average}%`);
  summaryDisplayText.append(' | Best ');
  appendMetric(best ? `${best.name} ${best.grade}%` : '—');
  summaryDisplayText.append(' | Lowest ');
  appendMetric(lowest ? `${lowest.name} ${lowest.grade}%` : '—');
}

function appendMetric(value) {
  const strong = document.createElement('strong');
  strong.textContent = value;
  summaryDisplayText.appendChild(strong);
}

if (globalGradeMethodSelect) {
  globalGradeMethodSelect.addEventListener('change', (event) => {
    gradeMethod = event.target.value;
    renderPreviousUnits();
  });
}

previousUnitsTableBody?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest('.remove-btn');
  if (!button) return;

  const index = Number(button.dataset.index);
  if (Number.isInteger(index) && index >= 0 && index < previousUnits.length) {
    previousUnits.splice(index, 1);
    renderPreviousUnits();
  }
});

if (addPreviousUnitForm) {
  addPreviousUnitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!addPreviousUnitForm.reportValidity()) return;

    const formData = new FormData(addPreviousUnitForm);
    previousUnits.push({
      name: String(formData.get('unitName')).trim(),
      grade: Number(formData.get('grade'))
    });
    addPreviousUnitForm.reset();
    document.getElementById('previousUnitGrade').value = '70';
    renderPreviousUnits();
  });
}

function saveDraft() {
  const draft = {
    units: previousUnits,
    year: document.getElementById('filterYear')?.value,
    semester: document.getElementById('filterSemester')?.value,
    university: document.getElementById('filterUniversity')?.value
  };

  try {
    localStorage.setItem('ravaPreviousUnits', JSON.stringify(previousUnits));
    localStorage.setItem('ravaAcademicDraft', JSON.stringify(draft));
    if (draftStatus) draftStatus.textContent = 'Draft saved on this device.';
  } catch {
    if (draftStatus) draftStatus.textContent = 'Draft could not be saved in this browser.';
  }
}

if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);

[filterYear, filterSemester, filterUniversity].forEach((filter) => {
  filter?.addEventListener('change', updateProfileDetails);
});

if (continueToPage2Btn) {
  continueToPage2Btn.addEventListener('click', () => {
    saveDraft();
    window.location.href = 'page2.html';
  });
}

renderPreviousUnits();
updateProfileDetails();