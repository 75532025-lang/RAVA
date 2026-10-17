const activeProfile = window.RavaStore.getActiveProfile();
if (!activeProfile?.profileSaved) {
  window.location.replace('page1.html#profile-form');
} else {
  const profile = activeProfile.profile;
  let units = Array.isArray(activeProfile.units) ? activeProfile.units : [];
  let answers = normalizeAnswers(activeProfile.quizAnswers);
  let currentSemester = activeProfile.currentSemester || {};
  let customComponents = Array.isArray(currentSemester.customComponents) ? currentSemester.customComponents : null;
  let previousTemplate = '70/30';

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
  const maximumUnitsInput = document.getElementById('maximumUnitsInput');
  const currentSemesterStatus = document.getElementById('currentSemesterStatus');
  const customDialog = document.getElementById('customBreakdownDialog');
  const customBreakdownForm = document.getElementById('customBreakdownForm');
  const customComponentList = document.getElementById('customComponentList');
  const customBreakdownTotal = document.getElementById('customBreakdownTotal');
  const customBreakdownError = document.getElementById('customBreakdownError');
  const applyCustomBreakdownButton = document.getElementById('applyCustomBreakdown');
  const componentChoices = ['Exam', 'CATs', 'Lab practicals', 'Assignments', 'RATs', 'Group work'];

  function populateAcademicYears(savedYear = '') {
    const currentYear = new Date().getFullYear();
    const startingYears = new Set(Array.from({ length: 9 }, (_, index) => currentYear - 4 + index));
    const savedMatch = String(savedYear).match(/^(\d{4})\/(\d{4})$/);
    if (savedMatch) startingYears.add(Number(savedMatch[1]));
    currentAcademicYearInput.replaceChildren(new Option('Choose academic year', ''));
    [...startingYears].sort((a, b) => a - b).forEach((year) => {
      const value = `${year}/${year + 1}`;
      currentAcademicYearInput.add(new Option(value, value));
    });
    if (savedYear && ![...currentAcademicYearInput.options].some((option) => option.value === savedYear)) {
      currentAcademicYearInput.add(new Option(savedYear, savedYear));
    }
    currentAcademicYearInput.value = savedYear || '';
  }

  populateAcademicYears(currentSemester.academicYear || '');
  currentSemesterSelect.value = currentSemester.semester || '';
  maximumUnitsInput.value = currentSemester.maxUnits || '';

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
    const name = window.RavaStore.firstName(profile.fullName);
    document.getElementById('assessmentHeading').textContent = `${name}'s semester assessment`;
    document.getElementById('assessmentName').textContent = name;
    document.getElementById('assessmentUniversity').textContent = profile.university;
    document.getElementById('assessmentCourse').textContent = profile.course;
    document.getElementById('assessmentYear').textContent = profile.yearOfStudy;
  }

  function readCurrentSemester() {
    return {
      academicYear: currentAcademicYearInput.value.trim(),
      semester: currentSemesterSelect.value,
      maxUnits: Number(maximumUnitsInput.value) || 0,
      customComponents: customComponents ? customComponents.map((component) => ({ ...component })) : null
    };
  }

  function currentSemesterIsReady() {
    const maxUnits = Number(maximumUnitsInput.value);
    return Boolean(currentAcademicYearInput.value.trim() && currentSemesterSelect.value && Number.isInteger(maxUnits) && maxUnits >= 1 && maxUnits <= 30);
  }

  function getStandardComponents(template) {
    const templates = {
      '70/30': [{ name: 'Exam', outOf: 70 }, { name: 'CATs', outOf: 30 }],
      '60/40': [{ name: 'Exam', outOf: 60 }, { name: 'CATs', outOf: 40 }],
      '50/50': [{ name: 'Exam', outOf: 50 }, { name: 'CATs', outOf: 50 }]
    };
    return templates[template] || [];
  }

  function validUnit(unit) {
    return Array.isArray(unit.components) && unit.components.length > 0 &&
      unit.components.every((component) => component.name && Number.isInteger(Number(component.outOf)) && Number(component.outOf) > 0) &&
      unit.components.reduce((total, component) => total + Number(component.outOf), 0) === 100;
  }

  function hasAllAnswers() {
    return ['q1', 'q2', 'q4', 'q5', 'q6'].every((key) => answers[key].length > 0) &&
      ['q3', 'q7', 'q8'].every((key) => Boolean(answers[key]));
  }

  function isAssessmentComplete() {
    const expectedUnits = Number(maximumUnitsInput.value);
    return currentSemesterIsReady() && expectedUnits === units.length && units.every(validUnit) && hasAllAnswers();
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
      unitsContainer.appendChild(makeElement('p', 'empty-state', 'No units yet. Add each unit you are taking this semester.'));
      validationStatus.textContent = currentSemesterIsReady() ? `0 of ${maximumUnitsInput.value} units added` : 'Set your semester details first';
      validationStatus.classList.remove('is-valid', 'is-warning');
      return;
    }

    units.forEach((unit) => {
      const card = makeElement('article', 'unit-entry');
      const header = makeElement('div', 'unit-entry-heading');
      const titleGroup = makeElement('div', 'unit-title-group');
      const title = makeElement('h3', '', unit.name);
      const badge = makeElement('span', 'unit-status', `${unit.components.reduce((sum, component) => sum + Number(component.outOf), 0)} marks`);
      const remove = makeElement('button', 'remove-unit-btn', 'Remove');
      remove.type = 'button';
      remove.dataset.unitId = unit.id;
      remove.setAttribute('aria-label', `Remove ${unit.name}`);
      titleGroup.append(title, badge);
      header.append(titleGroup, remove);

      const breakdown = makeElement('div', 'unit-components');
      unit.components.forEach((component) => {
        const row = makeElement('div', 'component-row');
        row.append(makeElement('span', '', component.name), makeElement('span', '', `Out of ${component.outOf}`));
        breakdown.appendChild(row);
      });
      card.append(header, breakdown);
      unitsContainer.appendChild(card);
    });

    const expectedUnits = Number(maximumUnitsInput.value) || 0;
    validationStatus.textContent = `${units.length} of ${expectedUnits || '?'} units added`;
    validationStatus.classList.toggle('is-valid', expectedUnits > 0 && units.length === expectedUnits);
    validationStatus.classList.toggle('is-warning', expectedUnits > 0 && units.length > expectedUnits);
  }

  function renderAssessmentState() {
    const complete = isAssessmentComplete();
    continueButton.disabled = !complete;
    const pendingSteps = [];
    const expectedUnits = Number(maximumUnitsInput.value) || 0;
    if (!currentAcademicYearInput.value.trim()) pendingSteps.push('Set the current academic year.');
    if (!currentSemesterSelect.value) pendingSteps.push('Choose the current semester.');
    if (!expectedUnits) pendingSteps.push('Enter the maximum number of units.');
    else if (units.length < expectedUnits) pendingSteps.push(`Add all ${expectedUnits} units (${units.length}/${expectedUnits} entered).`);
    else if (units.length > expectedUnits) pendingSteps.push(`Remove ${units.length - expectedUnits} extra unit(s) to match your semester count.`);
    if (!units.every(validUnit)) pendingSteps.push('Each unit must have components totaling 100 marks.');
    if (!hasAllAnswers()) pendingSteps.push('Answer all eight check-in questions.');
    assessmentStatus.textContent = complete
      ? 'All semester units and check-in answers are complete. Your personal targets are set in the next section.'
      : pendingSteps.join(' ');
    currentSemesterStatus.textContent = currentSemesterIsReady()
      ? `${units.length} of ${expectedUnits} units entered.`
      : 'Set current academic year, semester, and unit count.';
    window.RavaStore.updateActiveProfile({ assessmentComplete: complete, currentSemester: readCurrentSemester() });
    window.RavaStore.renderWorkflowProgress();
  }

  function renderCustomComponents(components) {
    customComponentList.replaceChildren();
    componentChoices.forEach((name) => {
      const existing = components.find((component) => component.name === name);
      const row = makeElement('div', 'custom-component-row');
      const label = makeElement('label', 'custom-component-label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'component-enabled';
      checkbox.checked = Boolean(existing);
      checkbox.dataset.component = name;
      label.append(checkbox, makeElement('span', '', name));

      const marksLabel = makeElement('label', 'custom-marks-label', 'Out of');
      const marks = document.createElement('input');
      marks.type = 'number';
      marks.className = 'component-marks';
      marks.min = '1';
      marks.max = '100';
      marks.step = '1';
      marks.value = existing?.outOf || '';
      marks.disabled = !checkbox.checked;
      marks.setAttribute('aria-label', `${name} marks out of`);
      marksLabel.appendChild(marks);
      row.append(label, marksLabel);
      customComponentList.appendChild(row);

      checkbox.addEventListener('change', () => {
        marks.disabled = !checkbox.checked;
        if (!checkbox.checked) marks.value = '';
        updateCustomTotal();
      });
      marks.addEventListener('input', updateCustomTotal);
    });
    updateCustomTotal();
  }

  function readCustomComponents() {
    return [...customComponentList.querySelectorAll('.custom-component-row')]
      .filter((row) => row.querySelector('.component-enabled').checked)
      .map((row) => ({
        name: row.querySelector('.component-enabled').dataset.component,
        outOf: Number(row.querySelector('.component-marks').value)
      }));
  }

  function updateCustomTotal() {
    const components = readCustomComponents();
    const total = components.reduce((sum, component) => sum + (Number.isInteger(component.outOf) ? component.outOf : 0), 0);
    customBreakdownTotal.textContent = `Selected marks: ${total} / 100`;
    customBreakdownTotal.classList.toggle('is-valid', total === 100 && components.length > 0);
    applyCustomBreakdownButton.disabled = total !== 100 || components.some((component) => !Number.isInteger(component.outOf) || component.outOf < 1);
  }

  function openCustomDialog() {
    customBreakdownError.textContent = '';
    renderCustomComponents(customComponents || [{ name: 'Exam', outOf: 60 }, { name: 'CATs', outOf: 40 }]);
    if (typeof customDialog.showModal === 'function') customDialog.showModal();
    else customDialog.setAttribute('open', '');
  }

  templateSelect.addEventListener('focus', () => {
    if (templateSelect.value !== 'custom') previousTemplate = templateSelect.value;
  });
  templateSelect.addEventListener('change', () => {
    if (templateSelect.value === 'custom') {
      openCustomDialog();
    } else {
      previousTemplate = templateSelect.value;
      customComponents = null;
      currentSemester = readCurrentSemester();
      window.RavaStore.updateActiveProfile({ currentSemester: { ...currentSemester, customComponents: null } });
    }
  });

  customBreakdownForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = readCustomComponents();
    const total = selected.reduce((sum, component) => sum + component.outOf, 0);
    if (!selected.length || selected.some((component) => !Number.isInteger(component.outOf) || component.outOf < 1) || total !== 100) {
      customBreakdownError.textContent = 'Choose components with whole-number maximum marks that total exactly 100.';
      return;
    }
    customComponents = selected;
    currentSemester = { ...readCurrentSemester(), customComponents };
    window.RavaStore.updateActiveProfile({ currentSemester });
    previousTemplate = 'custom';
    customDialog.close();
    customBreakdownError.textContent = '';
    formStatus.textContent = `Custom breakdown set: ${selected.map((component) => `${component.name} ${component.outOf}`).join(' · ')}.`;
  });

  function cancelCustomDialog() {
    templateSelect.value = previousTemplate === 'custom' ? '70/30' : previousTemplate;
    customDialog.close();
    customBreakdownError.textContent = '';
  }

  document.getElementById('cancelCustomBreakdown').addEventListener('click', cancelCustomDialog);
  document.getElementById('closeCustomBreakdown').addEventListener('click', cancelCustomDialog);
  customDialog.addEventListener('cancel', () => {
    templateSelect.value = previousTemplate === 'custom' ? '70/30' : previousTemplate;
  });

  currentSemesterForm.addEventListener('input', () => {
    currentSemester = readCurrentSemester();
    window.RavaStore.updateActiveProfile({ currentSemester, assessmentComplete: false, reportGenerated: false });
    renderUnits();
    renderAssessmentState();
  });

  unitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = unitNameInput.value.trim();
    const expectedUnits = Number(maximumUnitsInput.value) || 0;
    if (!currentSemesterIsReady()) {
      formStatus.textContent = 'Set the current academic year, semester, and unit count first.';
      return;
    }
    if (!name) {
      formStatus.textContent = 'Enter a unit name to add it.';
      unitNameInput.focus();
      return;
    }
    if (units.length >= expectedUnits) {
      formStatus.textContent = `You set ${expectedUnits} units for this semester. Change the unit count or remove a unit before adding another.`;
      return;
    }

    const template = templateSelect.value;
    const components = template === 'custom' ? customComponents : getStandardComponents(template);
    if (!components?.length) {
      formStatus.textContent = 'Choose a template or configure a custom breakdown first.';
      return;
    }
    units.push({ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), name, template, components: components.map((component) => ({ ...component })) });
    unitNameInput.value = '';
    formStatus.textContent = `${name} added (${units.length} of ${expectedUnits}).`;
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