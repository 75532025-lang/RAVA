const plannerKey = 'ravaPlannerState';
const draftKey = 'ravaAcademicDraft';
const defaultQuizAnswers = { q1: [], q2: [], q3: '', q4: [], q5: [], q6: [], q7: '', q8: '' };

function readStoredValue(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeUnits(units) {
  if (!Array.isArray(units)) return [];
  return units.filter((unit) => unit && typeof unit.name === 'string' && Array.isArray(unit.components))
    .map((unit) => ({
      id: String(unit.id || `${Date.now()}-${Math.random()}`),
      name: unit.name.trim(),
      template: String(unit.template || 'custom'),
      components: unit.components.filter((component) =>
        component && typeof component.name === 'string' &&
        Number.isFinite(Number(component.outOf)) && Number.isFinite(Number(component.target))
      ).map((component) => ({
        name: component.name,
        outOf: Number(component.outOf),
        target: Number(component.target)
      }))
    })).filter((unit) => unit.name && unit.components.length);
}

function normalizeQuizAnswers(answers) {
  if (!answers || typeof answers !== 'object') return { ...defaultQuizAnswers };
  return {
    q1: Array.isArray(answers.q1) ? answers.q1 : [],
    q2: Array.isArray(answers.q2) ? answers.q2 : [],
    q3: typeof answers.q3 === 'string' ? answers.q3 : '',
    q4: Array.isArray(answers.q4) ? answers.q4 : [],
    q5: Array.isArray(answers.q5) ? answers.q5 : [],
    q6: Array.isArray(answers.q6) ? answers.q6 : [],
    q7: typeof answers.q7 === 'string' ? answers.q7 : '',
    q8: typeof answers.q8 === 'string' ? answers.q8 : ''
  };
}

const plannerData = readStoredValue(plannerKey, {});
const draftData = readStoredValue(draftKey, {});
const savedPlanner = plannerData && typeof plannerData === 'object' ? plannerData : {};
const savedDraft = draftData && typeof draftData === 'object' ? draftData : {};
let unitsList = normalizeUnits(savedPlanner.units);
let quizAnswers = normalizeQuizAnswers(savedPlanner.quizAnswers);
window.quizAnswers = quizAnswers;

const unitNameInput = document.getElementById('unitNameInput');
const templateSelect = document.getElementById('templateSelect');
const unitBuilderForm = document.getElementById('unitBuilderForm');
const recordedUnitsContainer = document.getElementById('recordedUnitsContainer');
const overallValidation = document.getElementById('overallValidation');
const unitFormStatus = document.getElementById('unitFormStatus');
const quizButtons = document.querySelectorAll('.quiz-option[data-question]');
const reportButton = document.getElementById('getReportBtn');
const downloadReportButton = document.getElementById('downloadReportBtn');
const reportStatus = document.getElementById('reportStatusMsg');
const generatedReport = document.getElementById('generatedReport');
const summaryTargets = document.getElementById('summaryTargets');
const summaryEfforts = document.getElementById('summaryEfforts');
const summaryStruggles = document.getElementById('summaryStruggles');
const summaryStrengths = document.getElementById('summaryStrengths');
const semesterOverviewBody = document.getElementById('semesterOverviewBody');
const overallPattern = document.getElementById('overallPattern');
const diagnosisText = document.getElementById('diagnosisText');
const progressIndicator = document.getElementById('progressIndicator');
const progressLine = progressIndicator?.querySelector('.progress-line');
const progressBadge = progressIndicator?.querySelector('.progress-badge');

const yearSelect = document.getElementById('year-of-study');
const academicYearInput = document.getElementById('academic-year');
const semesterSelect = document.getElementById('semester');

if (yearSelect && savedDraft.year && [...yearSelect.options].some((option) => option.value === savedDraft.year)) {
  yearSelect.value = savedDraft.year.replace('Year ', '');
}
if (academicYearInput && savedDraft.academicYear) academicYearInput.value = savedDraft.academicYear;
if (semesterSelect && savedDraft.semester && [...semesterSelect.options].some((option) => option.value === savedDraft.semester.replace('Semester ', ''))) {
  semesterSelect.value = savedDraft.semester.replace('Semester ', '');
}

function persistPlanner() {
  try {
    localStorage.setItem(plannerKey, JSON.stringify({ units: unitsList, quizAnswers }));
    localStorage.setItem(draftKey, JSON.stringify({
      ...savedDraft,
      year: yearSelect ? `Year ${yearSelect.value}` : savedDraft.year,
      semester: semesterSelect ? `Semester ${semesterSelect.value}` : savedDraft.semester,
      academicYear: academicYearInput?.value || ''
    }));
  } catch {
    if (unitFormStatus) unitFormStatus.textContent = 'Changes could not be saved in this browser.';
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getComponents(template) {
  const templates = {
    '70/30': [
      { name: 'Exam', outOf: 70, target: 50 },
      { name: 'CATs', outOf: 30, target: 20 }
    ],
    '60/40': [
      { name: 'Exam', outOf: 60, target: 40 },
      { name: 'CATs', outOf: 40, target: 25 }
    ],
    '50/50': [
      { name: 'Exam', outOf: 50, target: 35 },
      { name: 'CATs', outOf: 50, target: 35 }
    ],
    custom: [
      { name: 'Exam', outOf: 50, target: 35 },
      { name: 'CATs', outOf: 30, target: 20 },
      { name: 'Practical', outOf: 20, target: 15 }
    ]
  };
  return templates[template] || templates['70/30'];
}

function isUnitValid(unit) {
  const totalWeight = unit.components.reduce((sum, component) => sum + component.outOf, 0);
  return totalWeight === 100 && unit.components.every((component) =>
    component.target >= 0 && component.target <= component.outOf
  );
}

function renderUnits() {
  if (!recordedUnitsContainer || !overallValidation) return;
  recordedUnitsContainer.replaceChildren();

  if (!unitsList.length) {
    recordedUnitsContainer.appendChild(createElement('p', 'empty-state', 'No units added yet. Enter a unit above to build your targets.'));
  }

  let allValid = unitsList.length > 0;
  unitsList.forEach((unit) => {
    const valid = isUnitValid(unit);
    allValid = allValid && valid;
    const card = createElement('article', `unit-entry${valid ? '' : ' is-invalid'}`);
    const heading = createElement('div', 'unit-entry-heading');
    const titleGroup = createElement('div', 'unit-title-group');
    const title = createElement('h4', '', unit.name);
    const badge = createElement('span', `unit-status${valid ? ' is-valid' : ' is-warning'}`, valid ? '100/100 valid' : 'Check weights and targets');
    const removeButton = createElement('button', 'remove-unit-btn', 'Remove unit');
    removeButton.type = 'button';
    removeButton.dataset.unitId = unit.id;
    removeButton.setAttribute('aria-label', `Remove ${unit.name}`);
    titleGroup.append(title, badge);
    heading.append(titleGroup, removeButton);

    const components = createElement('div', 'unit-components');
    unit.components.forEach((component) => {
      const row = createElement('div', 'component-row');
      row.append(
        createElement('span', '', component.name),
        createElement('span', '', `Target ${component.target} / ${component.outOf}`)
      );
      components.appendChild(row);
    });

    card.append(heading, components);
    recordedUnitsContainer.appendChild(card);
  });

  overallValidation.textContent = !unitsList.length ? 'Awaiting units' : allValid ? 'All units valid' : 'Review unit totals';
  overallValidation.classList.toggle('is-valid', allValid);
  overallValidation.classList.toggle('is-warning', unitsList.length > 0 && !allValid);
  updateReportGate();
  updateLiveSummary();
  renderSemesterOverview();
  updateProgress();
}

if (unitBuilderForm) {
  unitBuilderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = unitNameInput?.value.trim();
    if (!name) {
      if (unitFormStatus) unitFormStatus.textContent = 'Enter a unit name to continue.';
      unitNameInput?.focus();
      return;
    }

    unitsList.push({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name,
      template: templateSelect?.value || '70/30',
      components: getComponents(templateSelect?.value || '70/30')
    });
    unitNameInput.value = '';
    if (unitFormStatus) unitFormStatus.textContent = `${name} added.`;
    persistPlanner();
    renderUnits();
  });
}

recordedUnitsContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-unit-btn');
  if (!button) return;
  unitsList = unitsList.filter((unit) => unit.id !== button.dataset.unitId);
  persistPlanner();
  renderUnits();
});

function updateQuizButton(button, selected) {
  button.classList.toggle('is-selected', selected);
  button.setAttribute('aria-pressed', String(selected));
}

quizButtons.forEach((button) => {
  const question = button.dataset.question;
  const option = button.textContent.trim();
  const selected = Array.isArray(quizAnswers[question])
    ? quizAnswers[question].includes(option)
    : quizAnswers[question] === option;
  updateQuizButton(button, selected);

  button.addEventListener('click', () => {
    const multiSelect = ['q1', 'q2', 'q4', 'q5', 'q6'].includes(question);
    if (multiSelect) {
      const selectedOptions = quizAnswers[question];
      const existingIndex = selectedOptions.indexOf(option);
      if (existingIndex >= 0) selectedOptions.splice(existingIndex, 1);
      else selectedOptions.push(option);
      updateQuizButton(button, existingIndex < 0);
    } else {
      quizButtons.forEach((sibling) => {
        if (sibling.dataset.question === question) updateQuizButton(sibling, sibling === button);
      });
      quizAnswers[question] = option;
    }

    window.quizAnswers = quizAnswers;
    persistPlanner();
    updateLiveSummary();
    updateDiagnosis();
    updateProgress();
  });
});

function renderList(container, values, emptyText) {
  if (!container) return;
  container.replaceChildren();
  if (!values.length) {
    container.textContent = emptyText;
    return;
  }

  const list = document.createElement('ul');
  values.forEach((value) => list.appendChild(createElement('li', '', value)));
  container.appendChild(list);
}

function updateLiveSummary() {
  const effortItems = [...quizAnswers.q1, ...quizAnswers.q2];
  if (quizAnswers.q7) effortItems.push(`Sleep: ${quizAnswers.q7} per day`);
  if (quizAnswers.q8) effortItems.push(`Study: ${quizAnswers.q8} per day`);

  const struggleItems = [...quizAnswers.q4, ...quizAnswers.q6];
  const strengthItems = [...quizAnswers.q5];
  if (quizAnswers.q3) strengthItems.unshift(`Exam mindset: ${quizAnswers.q3}`);

  renderList(summaryEfforts, effortItems, 'Complete the check-in to see your efforts.');
  renderList(summaryStruggles, struggleItems, 'Complete the check-in to see your challenges.');
  renderList(summaryStrengths, strengthItems, 'Complete the check-in to see your strengths.');
  renderList(summaryTargets, unitsList.map((unit) => {
    const targetTotal = unit.components.reduce((sum, component) => sum + component.target, 0);
    return `${unit.name}: target ${targetTotal} points across components`;
  }), 'Add units above to see your targets.');
}

function renderSemesterOverview() {
  if (!semesterOverviewBody) return;
  semesterOverviewBody.replaceChildren();
  if (!unitsList.length) {
    const row = document.createElement('tr');
    const cell = createElement('td', '', 'Add units above to build your semester overview.');
    cell.colSpan = 4;
    row.appendChild(cell);
    semesterOverviewBody.appendChild(row);
    return;
  }

  const previousUnits = readStoredValue('ravaPreviousUnits', []);
  unitsList.forEach((unit, index) => {
    const row = document.createElement('tr');
    const matchingPrevious = Array.isArray(previousUnits)
      ? previousUnits.find((previous) => previous.name.toLowerCase() === unit.name.toLowerCase())
      : null;
    const targetText = unit.components.map((component) => `${component.name} ${component.target}/${component.outOf}`).join(' + ');
    const patternText = [...quizAnswers.q4, ...quizAnswers.q6].join(', ') || 'No challenges selected yet';
    [
      `${index + 1}. ${unit.name}`,
      targetText,
      matchingPrevious ? `Past: ${matchingPrevious.grade}%` : 'No matching past unit',
      patternText
    ].forEach((value) => row.appendChild(createElement('td', '', value)));
    semesterOverviewBody.appendChild(row);
  });
}

function updateDiagnosis() {
  const challenges = [...quizAnswers.q4, ...quizAnswers.q6];
  const strengths = [...quizAnswers.q5];
  if (overallPattern) {
    overallPattern.textContent = challenges.length
      ? `Focus area: ${challenges.join(', ')}`
      : strengths.length
        ? `Strengths to build on: ${strengths.join(', ')}`
        : 'Your study patterns will appear here after the check-in.';
  }
  if (diagnosisText) {
    diagnosisText.textContent = challenges.length || strengths.length
      ? `Your check-in shows ${strengths.length ? `strengths in ${strengths.join(', ')}` : 'room to build consistent study habits'}${challenges.length ? `, with challenges around ${challenges.join(', ')}` : ''}. Use short, planned practice sessions and review your progress each week.`
      : 'Complete the check-in to see a reflection based on your answers.';
  }
}

function getAllUnitsValid() {
  return unitsList.length > 0 && unitsList.every(isUnitValid);
}

function updateReportGate() {
  const allValid = getAllUnitsValid();
  if (reportButton) reportButton.disabled = !allValid;
  if (downloadReportButton) downloadReportButton.disabled = !allValid;
  if (reportStatus) {
    reportStatus.textContent = allValid
      ? 'Your unit totals are valid. Generate a report when you are ready.'
      : 'Add at least one unit and ensure each component total is 100 with targets within their weights.';
  }
}

function updateProgress() {
  if (!progressIndicator || !progressLine || !progressBadge) return;
  const answeredQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']
    .filter((key) => Array.isArray(quizAnswers[key]) ? quizAnswers[key].length > 0 : Boolean(quizAnswers[key])).length;
  const progress = Math.round(((answeredQuestions + (unitsList.length ? 1 : 0)) / 9) * 100);
  progressLine.style.width = `${progress}%`;
  progressBadge.textContent = `${progress}%`;
  progressIndicator.setAttribute('aria-label', `Planner progress ${progress} percent`);
}

function buildReport() {
  if (!generatedReport) return;
  generatedReport.replaceChildren();
  generatedReport.hidden = false;
  generatedReport.appendChild(createElement('h3', '', 'Your Academic Plan'));
  const year = yearSelect?.selectedOptions[0]?.textContent || 'Year not selected';
  const semester = semesterSelect?.selectedOptions[0]?.textContent || 'Semester not selected';
  const academicYear = academicYearInput?.value || 'Academic year not set';
  generatedReport.appendChild(createElement('p', '', `${year} · ${semester} · ${academicYear}`));
  generatedReport.appendChild(createElement('h4', '', 'Unit targets'));

  const list = document.createElement('ul');
  unitsList.forEach((unit) => {
    const breakdown = unit.components.map((component) => `${component.name}: target ${component.target}/${component.outOf}`).join('; ');
    list.appendChild(createElement('li', '', `${unit.name} — ${breakdown}`));
  });
  generatedReport.appendChild(list);
  generatedReport.appendChild(createElement('h4', '', 'Check-in summary'));
  const reflections = [...quizAnswers.q1, ...quizAnswers.q2, ...quizAnswers.q4, ...quizAnswers.q5, ...quizAnswers.q6];
  if (quizAnswers.q3) reflections.push(`Exam mindset: ${quizAnswers.q3}`);
  if (quizAnswers.q7) reflections.push(`Sleep: ${quizAnswers.q7} per day`);
  if (quizAnswers.q8) reflections.push(`Study: ${quizAnswers.q8} per day`);
  generatedReport.appendChild(createElement('p', '', reflections.length ? reflections.join(' · ') : 'No check-in answers were selected.'));
  generatedReport.appendChild(createElement('p', 'report-note', 'Use these targets as a guide and adjust them to match your course requirements.'));
}

reportButton?.addEventListener('click', () => {
  if (!getAllUnitsValid()) return;
  buildReport();
  generatedReport?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

downloadReportButton?.addEventListener('click', () => {
  if (!getAllUnitsValid()) return;
  if (generatedReport?.hidden) buildReport();
  const reportText = generatedReport?.innerText || 'Academic plan';
  const file = new Blob([`RAVA ACADEMIC PLAN\n\n${reportText}\n`], { type: 'text/plain;charset=utf-8' });
  const fileUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = 'rava-academic-plan.txt';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
});

const planOutput = document.getElementById('planOutput');
const ownPlanEditor = document.getElementById('ownPlanEditor');
const ownPlanNotes = document.getElementById('ownPlanNotes');
const ownPlanStatus = document.getElementById('ownPlanStatus');

if (ownPlanNotes) ownPlanNotes.value = readStoredValue('ravaOwnPlan', '');

document.getElementById('showSamplePlanBtn')?.addEventListener('click', () => {
  if (!planOutput) return;
  planOutput.replaceChildren();
  planOutput.hidden = false;
  if (ownPlanEditor) ownPlanEditor.hidden = true;
  planOutput.appendChild(createElement('h3', '', 'A balanced week to adapt'));
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const list = document.createElement('ul');
  days.forEach((day, index) => {
    const unit = unitsList[index % Math.max(unitsList.length, 1)];
    const activity = index === 6
      ? 'Rest and review the week'
      : unit
        ? `Practice ${unit.name} with active recall`
        : 'Choose one unit for a focused 30-minute review';
    list.appendChild(createElement('li', '', `${day}: ${activity}`));
  });
  planOutput.appendChild(list);
});

document.getElementById('createOwnPlanBtn')?.addEventListener('click', () => {
  if (planOutput) planOutput.hidden = true;
  if (ownPlanEditor) ownPlanEditor.hidden = false;
  ownPlanNotes?.focus();
});

document.getElementById('saveOwnPlanBtn')?.addEventListener('click', () => {
  try {
    localStorage.setItem('ravaOwnPlan', ownPlanNotes?.value || '');
    if (ownPlanStatus) ownPlanStatus.textContent = 'Your plan is saved on this device.';
  } catch {
    if (ownPlanStatus) ownPlanStatus.textContent = 'Your plan could not be saved in this browser.';
  }
});

[yearSelect, academicYearInput, semesterSelect].forEach((field) => {
  field?.addEventListener('change', persistPlanner);
});

renderUnits();
quizButtons.forEach((button) => {
  const question = button.dataset.question;
  const option = button.textContent.trim();
  const selected = Array.isArray(quizAnswers[question])
    ? quizAnswers[question].includes(option)
    : quizAnswers[question] === option;
  updateQuizButton(button, selected);
});
updateLiveSummary();
updateDiagnosis();
updateProgress();