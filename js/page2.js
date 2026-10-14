const activeProfile = window.RavaStore.getActiveProfile();
if (!activeProfile?.profileSaved) {
  window.location.replace('page1.html#profile-form');
} else {
  const profile = activeProfile.profile;
  let units = Array.isArray(activeProfile.units) ? activeProfile.units : [];
  let answers = normalizeAnswers(activeProfile.quizAnswers);
  let currentSemester = activeProfile.currentSemester || {};

  const unitForm = document.getElementById('unitBuilderForm');
  const unitNameInput = document.getElementById('unitNameInput');
  const templateSelect = document.getElementById('templateSelect');
  const unitsContainer = document.getElementById('recordedUnitsContainer');
  const validationStatus = document.getElementById('overallValidation');
  const formStatus = document.getElementById('unitFormStatus');
  const assessmentStatus = document.getElementById('assessmentStatus');
  const continueButton = document.getElementById('continueToFindingsBtn');
  const quizButtons = document.querySelectorAll('.quiz-option[data-question]');
  const currentSemesterForm = document.getElementById('currentSemesterForm');
  const currentAcademicYearInput = document.getElementById('currentAcademicYear');
  const currentSemesterSelect = document.getElementById('currentSemesterSelect');
  const currentSemesterStatus = document.getElementById('currentSemesterStatus');

  currentAcademicYearInput.value = currentSemester.academicYear || '';
  currentSemesterSelect.value = currentSemester.semester || '';

  function normalizeAnswers(saved) {
    const defaults = { q1: [], q2: [], q3: '', q4: [], q5: [], q6: [], q7: '', q8: '' };
    if (!saved || typeof saved !== 'object') return defaults;
    Object.keys(defaults).forEach((key) => {
      defaults[key] = Array.isArray(defaults[key])
        ? Array.isArray(saved[key]) ? saved[key] : []
        : typeof saved[key] === 'string' ? saved[key] : '';
    });
    return defaults;
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function setProfileContext() {
    document.getElementById('assessmentHeading').textContent = `${profile.fullName}'s semester assessment`;
    document.getElementById('assessmentName').textContent = profile.fullName;
    document.getElementById('assessmentUniversity').textContent = profile.university;
    document.getElementById('assessmentCourse').textContent = profile.course;
    document.getElementById('assessmentYear').textContent = profile.yearOfStudy;

    const previousSemester = profile.previousSemester || {};
    const historyLabel = [previousSemester.studyYear, previousSemester.academicYear, previousSemester.semester].filter(Boolean).join(' · ');
    document.getElementById('previousSemesterContext').textContent = historyLabel || 'No previous-semester details saved on Home.';
    const preview = document.getElementById('previousUnitsPreview');
    preview.replaceChildren();
    const previousUnits = Array.isArray(previousSemester.units) ? previousSemester.units : [];
    if (!previousUnits.length) {
      preview.appendChild(makeElement('li', '', 'No previous unit grades recorded.'));
    } else {
      previousUnits.forEach((unit) => preview.appendChild(makeElement('li', '', `${unit.name}: ${unit.grade}%`)));
    }
  }

  function readCurrentSemester() {
    return {
      academicYear: currentAcademicYearInput.value.trim(),
      semester: currentSemesterSelect.value
    };
  }

  function currentSemesterIsReady() {
    return Boolean(profile.yearOfStudy && currentAcademicYearInput.value.trim() && currentSemesterSelect.value);
  }

  function getComponents(template) {
    const templates = {
      '70/30': [{ name: 'Exam', outOf: 70, target: 50 }, { name: 'CATs', outOf: 30, target: 20 }],
      '60/40': [{ name: 'Exam', outOf: 60, target: 40 }, { name: 'CATs', outOf: 40, target: 25 }],
      '50/50': [{ name: 'Exam', outOf: 50, target: 35 }, { name: 'CATs', outOf: 50, target: 35 }],
      custom: [{ name: 'Exam', outOf: 50, target: 35 }, { name: 'CATs', outOf: 30, target: 20 }, { name: 'Practical', outOf: 20, target: 15 }]
    };
    return templates[template] || templates['70/30'];
  }

  function validUnit(unit) {
    return unit.components.reduce((total, component) => total + Number(component.outOf), 0) === 100 &&
      unit.components.every((component) => Number(component.target) >= 0 && Number(component.target) <= Number(component.outOf));
  }

  function hasAllAnswers() {
    return ['q1', 'q2', 'q4', 'q5', 'q6'].every((key) => answers[key].length > 0) &&
      ['q3', 'q7', 'q8'].every((key) => Boolean(answers[key]));
  }

  function isAssessmentComplete() {
    return currentSemesterIsReady() && units.length > 0 && units.every(validUnit) && hasAllAnswers();
  }

  function persistAssessment() {
    const complete = isAssessmentComplete();
    window.RavaStore.updateActiveProfile({
      units,
      quizAnswers: answers,
      currentSemester: readCurrentSemester(),
      assessmentComplete: complete,
      reportGenerated: false
    });
    renderAssessmentState();
  }

  function renderUnits() {
    unitsContainer.replaceChildren();
    if (!units.length) {
      unitsContainer.appendChild(makeElement('p', 'empty-state', 'No units yet. Add the units you are taking this semester.'));
      validationStatus.textContent = 'Awaiting units';
      validationStatus.classList.remove('is-valid', 'is-warning');
      return;
    }

    const allValid = units.every(validUnit);
    units.forEach((unit) => {
      const card = makeElement('article', 'unit-entry');
      const header = makeElement('div', 'unit-entry-heading');
      const titleGroup = makeElement('div', 'unit-title-group');
      const title = makeElement('h3', '', unit.name);
      const badge = makeElement('span', `unit-status${validUnit(unit) ? ' is-valid' : ' is-warning'}`, validUnit(unit) ? 'Weight total 100' : 'Review breakdown');
      const remove = makeElement('button', 'remove-unit-btn', 'Remove');
      remove.type = 'button';
      remove.dataset.unitId = unit.id;
      remove.setAttribute('aria-label', `Remove ${unit.name}`);
      titleGroup.append(title, badge);
      header.append(titleGroup, remove);

      const breakdown = makeElement('div', 'unit-components');
      unit.components.forEach((component) => {
        const row = makeElement('div', 'component-row');
        row.append(makeElement('span', '', component.name), makeElement('span', '', `Target ${component.target} / ${component.outOf}`));
        breakdown.appendChild(row);
      });
      card.append(header, breakdown);
      unitsContainer.appendChild(card);
    });

    validationStatus.textContent = allValid ? 'All units valid' : 'Review unit totals';
    validationStatus.classList.toggle('is-valid', allValid);
    validationStatus.classList.toggle('is-warning', !allValid);
  }

  function renderList(id, values, emptyText) {
    const container = document.getElementById(id);
    container.replaceChildren();
    if (!values.length) {
      container.textContent = emptyText;
      return;
    }
    const list = document.createElement('ul');
    values.forEach((value) => list.appendChild(makeElement('li', '', value)));
    container.appendChild(list);
  }

  function renderSummary() {
    const efforts = [...answers.q1, ...answers.q2];
    if (answers.q7) efforts.push(`Sleep: ${answers.q7}`);
    if (answers.q8) efforts.push(`Study: ${answers.q8}`);
    const struggles = [...answers.q4, ...answers.q6];
    const strengths = [...answers.q5];
    if (answers.q3) strengths.unshift(`Exam mindset: ${answers.q3}`);

    renderList('summaryEfforts', efforts, 'Select your study habits and schedule.');
    renderList('summaryStruggles', struggles, 'Select the challenges you want to address.');
    renderList('summaryStrengths', strengths, 'Select strengths you can build on.');
    renderList('summaryTargets', units.map((unit) => {
      const target = unit.components.reduce((total, component) => total + Number(component.target), 0);
      return `${unit.name}: target ${target} points across its components`;
    }), 'Your unit targets will appear here.');
  }

  function renderOverview() {
    const tableBody = document.getElementById('semesterOverviewBody');
    tableBody.replaceChildren();
    if (!units.length) {
      const row = document.createElement('tr');
      const cell = makeElement('td', '', 'Add units above to create your semester overview.');
      cell.colSpan = 4;
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    units.forEach((unit, index) => {
      const row = document.createElement('tr');
      const components = unit.components.map((component) => `${component.name} ${component.target}/${component.outOf}`).join(' + ');
      const notes = [...answers.q4, ...answers.q6].join(', ') || 'No challenges selected';
      const previousUnits = Array.isArray(profile.previousSemester?.units) ? profile.previousSemester.units : [];
      const pastUnit = previousUnits.find((previous) => previous.name.toLocaleLowerCase() === unit.name.toLocaleLowerCase());
      [`${index + 1}. ${unit.name}`, components, pastUnit ? `Previous semester: ${pastUnit.grade}%` : 'No matching previous unit', notes]
        .forEach((text) => row.appendChild(makeElement('td', '', text)));
      tableBody.appendChild(row);
    });
  }

  function renderAssessmentState() {
    const complete = isAssessmentComplete();
    continueButton.disabled = !complete;
    const pendingSteps = [];
    if (!currentSemesterIsReady()) pendingSteps.push('Set the current academic year and semester.');
    if (!units.length) pendingSteps.push('Add at least one current unit.');
    else if (!units.every(validUnit)) pendingSteps.push('Correct each unit so weights total 100 and targets stay within those weights.');
    if (!hasAllAnswers()) pendingSteps.push('Answer all eight check-in questions.');
    assessmentStatus.textContent = complete
      ? 'Assessment complete. Your findings and recommendations are ready for review.'
      : pendingSteps.join(' ');
    currentSemesterStatus.textContent = currentSemesterIsReady()
      ? 'Current semester details saved with this assessment.'
      : 'Set the current academic year and semester before completing the assessment.';
    renderOverview();
    renderSummary();
    window.RavaStore.updateActiveProfile({ assessmentComplete: complete, currentSemester: readCurrentSemester() });
    window.RavaStore.renderWorkflowProgress();
  }

  currentSemesterForm.addEventListener('input', () => {
    currentSemester = readCurrentSemester();
    window.RavaStore.updateActiveProfile({ currentSemester, reportGenerated: false });
    renderAssessmentState();
  });

  unitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = unitNameInput.value.trim();
    if (!name) {
      formStatus.textContent = 'Enter a unit name to add it.';
      unitNameInput.focus();
      return;
    }
    const template = templateSelect.value;
    units.push({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), name, template, components: getComponents(template) });
    unitNameInput.value = '';
    formStatus.textContent = `${name} added to this semester.`;
    persistAssessment();
    renderUnits();
  });

  unitsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.remove-unit-btn');
    if (!button) return;
    units = units.filter((unit) => unit.id !== button.dataset.unitId);
    persistAssessment();
    renderUnits();
  });

  function setOptionState(button, selected) {
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }

  quizButtons.forEach((button) => {
    const key = button.dataset.question;
    const value = button.textContent.trim();
    setOptionState(button, Array.isArray(answers[key]) ? answers[key].includes(value) : answers[key] === value);
    button.addEventListener('click', () => {
      const multi = ['q1', 'q2', 'q4', 'q5', 'q6'].includes(key);
      if (multi) {
        const selected = answers[key];
        const index = selected.indexOf(value);
        if (index >= 0) selected.splice(index, 1);
        else selected.push(value);
        setOptionState(button, index < 0);
      } else {
        quizButtons.forEach((other) => {
          if (other.dataset.question === key) setOptionState(other, other === button);
        });
        answers[key] = value;
      }
      persistAssessment();
      renderAssessmentState();
    });
  });

  continueButton.addEventListener('click', () => {
    if (!isAssessmentComplete()) return;
    window.RavaStore.updateActiveProfile({ units, quizAnswers: answers, currentSemester: readCurrentSemester(), assessmentComplete: true, reportGenerated: false });
    window.location.href = 'page3.html';
  });

  setProfileContext();
  renderUnits();
  renderAssessmentState();
}