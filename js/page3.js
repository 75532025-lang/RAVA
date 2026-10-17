const activeProfile = window.RavaStore.getActiveProfile();
if (!activeProfile?.profileSaved || !activeProfile.assessmentComplete) {
  window.location.replace(activeProfile?.profileSaved ? 'page2.html' : 'page1.html#profile-form');
} else {
  const profile = activeProfile.profile;
  const currentSemester = activeProfile.currentSemester || {};
  const previousHistory = profile.previousSemester || {};
  const previousUnits = Array.isArray(previousHistory.units) ? previousHistory.units : [];
  const answers = activeProfile.quizAnswers || {};
  let units = Array.isArray(activeProfile.units) ? activeProfile.units : [];

  const targetForms = document.getElementById('unitTargetForms');
  const targetStatus = document.getElementById('targetCompletionStatus');
  const reportOutput = document.getElementById('reportOutput');
  const generateButton = document.getElementById('generateReportBtn');
  const downloadButton = document.getElementById('downloadReportBtn');
  const reportStatus = document.getElementById('reportStatus');

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function targetIsValid(component) {
    if (component.target === null || component.target === undefined || component.target === '') return false;
    const target = Number(component.target);
    return Number.isInteger(target) && target >= 0 && target <= Number(component.outOf);
  }

  function previousGradeType(unit) {
    return unit.gradeType || (typeof unit.grade === 'number' ? 'percent' : 'letter');
  }

  function previousGradeLabel(unit) {
    return previousGradeType(unit) === 'percent' ? `${unit.grade}%` : String(unit.grade);
  }

  function percentageHistory() {
    return previousUnits.filter((unit) => previousGradeType(unit) === 'percent' && Number.isFinite(Number(unit.grade)));
  }

  function allTargetsAreValid() {
    const requiredUnitCount = Number(currentSemester.maxUnits);
    return activeProfile.assessmentComplete && requiredUnitCount > 0 && units.length === requiredUnitCount &&
      units.every((unit) => Array.isArray(unit.components) && unit.components.length > 0 && unit.components.every(targetIsValid));
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

  function getPreviousUnit(unitName) {
    return previousUnits.find((unit) => unit.name.toLocaleLowerCase() === unitName.toLocaleLowerCase());
  }

  function renderSummary() {
    const efforts = [...(answers.q1 || []), ...(answers.q2 || [])];
    if (answers.q7) efforts.push(`Sleep: ${answers.q7}`);
    if (answers.q8) efforts.push(`Study: ${answers.q8}`);
    const struggles = [...(answers.q4 || []), ...(answers.q6 || [])];
    const strengths = [...(answers.q5 || [])];
    if (answers.q3) strengths.unshift(`Exam mindset: ${answers.q3}`);

    document.getElementById('personalSummaryHeading').textContent = `${window.RavaStore.firstName(profile.fullName)}'s semester snapshot`;
    renderList('summaryEfforts', efforts, 'No study habits selected.');
    renderList('summaryStruggles', struggles, 'No specific challenge selected.');
    renderList('summaryStrengths', strengths, 'No strengths selected.');
    renderSummaryTargets();
  }

  function renderSummaryTargets() {
    const targets = units.map((unit) => {
      const components = unit.components.map((component) => targetIsValid(component)
        ? `${component.name} ${component.target}/${component.outOf}`
        : `${component.name}: target not set`);
      return `${unit.name}: ${components.join(' · ')}`;
    });
    renderList('summaryTargets', targets, 'Your assessed units will appear here.');
  }

  function renderTargetInputs() {
    targetForms.replaceChildren();
    if (!units.length) {
      targetForms.appendChild(makeElement('p', 'empty-state', 'No assessed units found. Return to Assessment and add the units for this semester.'));
      return;
    }

    units.forEach((unit, unitIndex) => {
      const card = makeElement('article', 'target-unit-card');
      const heading = makeElement('div', 'target-unit-heading');
      heading.append(makeElement('h3', '', unit.name), makeElement('span', 'component-count', `${unit.components.length} components`));
      const componentList = makeElement('div', 'target-component-list');

      unit.components.forEach((component, componentIndex) => {
        const row = makeElement('div', 'target-component-row');
        const label = makeElement('label', '', component.name);
        const input = document.createElement('input');
        const inputId = `target-${unitIndex}-${componentIndex}`;
        input.type = 'number';
        input.id = inputId;
        input.min = '0';
        input.max = String(component.outOf);
        input.step = '1';
        input.inputMode = 'numeric';
        input.placeholder = 'Your target';
        input.value = targetIsValid(component) ? String(component.target) : '';
        input.setAttribute('aria-label', `${unit.name}: ${component.name} target out of ${component.outOf}`);
        label.htmlFor = inputId;
        const field = makeElement('div', 'target-input-group');
        field.append(input, makeElement('span', 'component-maximum', `of ${component.outOf}`));
        row.append(label, field);
        componentList.appendChild(row);

        input.addEventListener('input', () => {
          component.target = input.value === '' ? null : Number(input.value);
          saveTargets();
        });
      });

      card.append(heading, componentList);
      targetForms.appendChild(card);
    });
  }

  function updateTargetStatus() {
    if (!units.length) {
      targetStatus.textContent = 'No units were added to the assessment.';
      return;
    }
    if (allTargetsAreValid()) {
      targetStatus.textContent = 'Every unit component has a valid target. Your analysis and report are ready.';
      return;
    }
    const remaining = units.reduce((count, unit) => count + unit.components.filter((component) => !targetIsValid(component)).length, 0);
    targetStatus.textContent = `${remaining} component ${remaining === 1 ? 'target remains' : 'targets remain'}. Enter whole numbers from 0 to each component maximum.`;
  }

  function currentAnalysis() {
    const challenges = [...(answers.q4 || []), ...(answers.q6 || [])];
    const strengths = [...(answers.q5 || [])];
    const percentGrades = percentageHistory();
    const previousAverage = percentGrades.length
      ? percentGrades.reduce((total, unit) => total + Number(unit.grade), 0) / percentGrades.length
      : null;
    const challenge = challenges.length
      ? `You identified ${challenges.join(', ').toLowerCase()} as the hardest parts of studying right now.`
      : 'You did not identify one main difficulty, so a steady routine is a useful place to begin.';
    const strength = strengths.length
      ? `You can build on strengths such as ${strengths.join(', ').toLowerCase()}.`
      : 'Notice which study sessions help ideas stick, then repeat what works.';
    const history = previousAverage === null
      ? ''
      : `Your previous percentage-grade average was ${previousAverage.toFixed(1)}% across ${percentGrades.length} units. Treat it as a starting point, not a limit.`;
    const targetCount = units.flatMap((unit) => unit.components).filter(targetIsValid).length;
    const targetNote = allTargetsAreValid()
      ? 'You have set a goal for every assessment component.'
      : `${targetCount} component targets are complete so far.`;
    return [challenge, strength, history, targetNote].filter(Boolean).join(' ');
  }

  function renderFindings() {
    document.getElementById('diagnosisText').textContent = currentAnalysis();
    document.getElementById('assessmentResultChip').textContent = `${units.length} ${units.length === 1 ? 'unit' : 'units'} · ${allTargetsAreValid() ? 'targets complete' : 'targets in progress'}`;
    const container = document.getElementById('unitFindings');
    container.replaceChildren();

    units.forEach((unit) => {
      const card = makeElement('article', 'unit-finding');
      const previous = getPreviousUnit(unit.name);
      const targetParts = unit.components.map((component) => targetIsValid(component)
        ? `${component.name} ${component.target}/${component.outOf}`
        : `${component.name} target pending`);
      const totalTarget = unit.components.every(targetIsValid)
        ? unit.components.reduce((total, component) => total + Number(component.target), 0)
        : null;
      card.append(
        makeElement('h3', '', unit.name),
        makeElement('p', 'unit-distribution', `${unit.components.length} components · ${unit.components.map((component) => `${component.name} ${component.outOf}`).join(' · ')}`),
        makeElement('p', 'unit-finding-result', `${targetParts.join(' · ')}${totalTarget === null ? '' : ` · combined target ${totalTarget}/100`}${previous ? ` · previous result ${previousGradeLabel(previous)}` : ''}`)
      );
      container.appendChild(card);
    });
  }

  const recommendationGuides = [
    { matches: ['Timed exams'], title: 'Practise exam pacing', why: 'A timer can make it harder to think clearly, even when you know the material. Short practice makes the format more familiar.', action: 'Try a small set of timed questions, then review your working before increasing the difficulty.' },
    { matches: ['Understanding concepts', "Didn't understand topics"], title: 'Make concepts easier to retrieve', why: 'Rereading can feel familiar without showing which parts you can explain on your own.', action: 'Close your notes and explain one idea in plain words. Reopen them only to fill the gaps.' },
    { matches: ['Cramming / Procrastination', 'Crammed last minute'], title: 'Break revision into smaller visits', why: 'Leaving everything until the end creates pressure and makes details harder to remember.', action: 'Choose one small topic for a 20-minute session, then revisit it later in the week.' },
    { matches: ['Sleep / Stress', 'Stressed / Slept badly'], title: 'Protect rest while you study', why: 'Rest supports attention and memory. A plan with no recovery time is difficult to keep.', action: 'Choose a realistic stopping time and leave a short wind-down before bed.' },
    { matches: ['Skipping CATs'], title: 'Prepare for assessments in small steps', why: 'Short preparation is easier to start and gives you more chances to notice questions.', action: 'Schedule two brief practice blocks before the next assessment.' },
    { matches: ['Too many units'], title: 'Rotate subjects with a simple plan', why: 'Trying to study everything at once can make it hard to choose a next step.', action: 'Pick two or three subjects for each day and write one specific task for each.' },
    { matches: ["Didn't plan ahead"], title: 'Use a short weekly reset', why: 'Seeing deadlines and study blocks together makes the week feel more manageable.', action: 'List deadlines at the start of the week and reserve a few realistic study blocks.' }
  ];

  function guideForUnit(unit, index) {
    const challenges = [...(answers.q4 || []), ...(answers.q6 || [])];
    const matching = recommendationGuides.filter((guide) => guide.matches.some((item) => challenges.includes(item)));
    if (matching.length) return matching[index % matching.length];
    const previous = getPreviousUnit(unit.name);
    if (previous && previousGradeType(previous) === 'percent' && Number(previous.grade) < 60) {
      return {
        title: 'Build this unit from its foundations',
        why: `Your previous ${unit.name} mark was ${previousGradeLabel(previous)}. That is useful information, not a judgement about your ability.`,
        action: 'Review one core idea, try a few practice questions, and ask for help with the first unclear step.'
      };
    }
    return {
      title: 'Keep a steady rhythm in this unit',
      why: 'Regular short review gives you more chances to notice confusion before it grows.',
      action: `Choose one ${unit.name} topic, practise recalling it, and return to it later in the week.`
    };
  }

  function renderRecommendations() {
    const container = document.getElementById('recommendationList');
    container.replaceChildren();
    units.forEach((unit, index) => {
      const guide = guideForUnit(unit, index);
      const card = makeElement('article', 'recommendation-item');
      card.append(
        makeElement('span', 'recommendation-number', String(index + 1)),
        makeElement('h3', '', `${unit.name}: ${guide.title}`),
        makeElement('p', 'recommendation-why', `Why: ${guide.why}`),
        makeElement('p', 'recommendation-action', `Try this: ${guide.action}`)
      );
      container.appendChild(card);
    });

    const challenges = [...(answers.q4 || []), ...(answers.q6 || [])];
    const strengths = [...(answers.q5 || [])];
    const reason = challenges.length
      ? `You named ${challenges.join(', ').toLowerCase()} as difficult. Small, repeatable steps can lower pressure and help you see progress.`
      : 'A predictable routine reduces the effort it takes to decide what to study next.';
    const nextStep = strengths.length
      ? `Build on ${strengths.join(', ').toLowerCase()} by reserving a regular study time and leaving breaks between subjects.`
      : 'Choose a regular study time, work in short blocks, and leave room for rest and other responsibilities.';
    const general = makeElement('article', 'recommendation-item general-recommendation');
    general.append(
      makeElement('span', 'recommendation-number', '•'),
      makeElement('h3', '', 'A steady plan for the whole semester'),
      makeElement('p', 'recommendation-why', `Why: ${reason}`),
      makeElement('p', 'recommendation-action', `Try this: ${nextStep}`)
    );
    container.appendChild(general);
  }

  function updateTargetViews() {
    renderSummaryTargets();
    renderFindings();
    renderRecommendations();
    updateTargetStatus();
    syncReportState();
    window.RavaStore.renderWorkflowProgress();
  }

  function renderSummaryTargets() {
    const lines = units.map((unit) => `${unit.name}: ${unit.components.map((component) =>
      targetIsValid(component) ? `${component.name} ${component.target}/${component.outOf}` : `${component.name} target not set`
    ).join(' · ')}`);
    renderList('summaryTargets', lines, 'Your unit components will appear here.');
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

  function saveTargets() {
    const updated = window.RavaStore.updateActiveProfile({ units, reportGenerated: false });
    if (!updated) targetStatus.textContent = 'Your targets could not be saved in this browser.';
    reportOutput.replaceChildren();
    reportOutput.hidden = true;
    updateTargetViews();
  }

  function updateTargetStatus() {
    if (!units.length) {
      targetStatus.textContent = 'No units were added to the assessment.';
      return;
    }
    if (allTargetsAreValid()) {
      targetStatus.textContent = 'Every unit component has a valid target. Your analysis and report are ready.';
      return;
    }
    const pending = units.reduce((count, unit) => count + unit.components.filter((component) => !targetIsValid(component)).length, 0);
    targetStatus.textContent = `${pending} component ${pending === 1 ? 'target remains' : 'targets remain'}. Enter whole numbers from 0 to each component maximum.`;
  }

  function buildReport() {
    reportOutput.replaceChildren();
    reportOutput.hidden = false;
    reportOutput.appendChild(makeElement('h3', '', `Academic progress report for ${window.RavaStore.firstName(profile.fullName)}`));
    reportOutput.appendChild(makeElement('p', '', `Prepared ${new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}. This study-planning report is based on your self-reported check-in and goals; it is not a clinical diagnosis.`));
    reportOutput.appendChild(makeElement('h4', '', 'Semester overview'));
    reportOutput.appendChild(makeElement('p', '', `${profile.course}, ${profile.yearOfStudy} · ${currentSemester.semester}, ${currentSemester.academicYear} · ${units.length} units`));
    reportOutput.appendChild(makeElement('h4', '', 'Previous academic context'));
    reportOutput.appendChild(makeElement('p', '', [previousHistory.studyYear, previousHistory.academicYear, previousHistory.semester].filter(Boolean).join(' · ') || 'No previous-semester details recorded.'));
    const percentGrades = percentageHistory();
    if (percentGrades.length) {
      const average = percentGrades.reduce((total, unit) => total + Number(unit.grade), 0) / percentGrades.length;
      reportOutput.appendChild(makeElement('p', '', `Previous percentage grades averaged ${average.toFixed(1)}% across ${percentGrades.length} units. Use this as context, not a limit.`));
    }
    reportOutput.appendChild(makeElement('h4', '', 'Your check-in and current pattern'));
    reportOutput.appendChild(makeElement('p', '', document.getElementById('diagnosisText').textContent));
    reportOutput.appendChild(makeElement('h4', '', 'Unit distributions and targets'));
    const targets = document.createElement('ul');
    units.forEach((unit) => {
      const breakdown = unit.components.map((component) => `${component.name}: target ${component.target} of ${component.outOf}`).join('; ');
      const previous = getPreviousUnit(unit.name);
      targets.appendChild(makeElement('li', '', `${unit.name} — ${breakdown}${previous ? `; previous mark ${previousGradeLabel(previous)}` : ''}.`));
    });
    reportOutput.appendChild(targets);
    reportOutput.appendChild(makeElement('h4', '', 'Recommendations and why they may help'));
    const recommendations = document.createElement('ul');
    document.querySelectorAll('.recommendation-item').forEach((card) => {
      recommendations.appendChild(makeElement('li', '', `${card.querySelector('h3')?.textContent || ''}. ${card.querySelector('.recommendation-why')?.textContent || ''} ${card.querySelector('.recommendation-action')?.textContent || ''}`));
    });
    reportOutput.appendChild(recommendations);
    const savedWeeklyPlan = window.RavaStore.getActiveProfile()?.weeklyPlan;
    if (savedWeeklyPlan?.trim()) {
      reportOutput.appendChild(makeElement('h4', '', 'Your weekly plan'));
      reportOutput.appendChild(makeElement('p', '', savedWeeklyPlan));
    }
    reportOutput.appendChild(makeElement('p', 'report-note', 'Targets are a starting point. Adjust them when course requirements or circumstances change, and ask a lecturer, tutor, or student-support professional for help when needed.'));
  }

  function syncReportState() {
    const latest = window.RavaStore.getActiveProfile();
    const reportReady = Boolean(latest?.reportGenerated) && allTargetsAreValid();
    generateButton.disabled = !allTargetsAreValid();
    downloadButton.disabled = !reportReady || window.RavaStore.calculateWorkflowProgress(latest) !== 100;
    reportStatus.textContent = !allTargetsAreValid()
      ? 'Enter a valid target for every component before generating the report.'
      : reportReady
        ? 'Your report is complete and ready to download.'
        : 'Targets are complete. Generate the report to finish the final step.';
  }

  document.getElementById('showSamplePlanBtn').addEventListener('click', () => {
    const output = document.getElementById('planOutput');
    output.replaceChildren();
    output.hidden = false;
    document.getElementById('ownPlanEditor').hidden = true;
    output.appendChild(makeElement('h3', '', 'A flexible week to adapt'));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const list = document.createElement('ul');
    days.forEach((day, index) => {
      const unit = units[index % units.length];
      list.appendChild(makeElement('li', '', `${day}: ${index === 6 ? 'Rest and review the week' : `Review ${unit.name} with active recall`}`));
    });
    output.appendChild(list);
  });

  document.getElementById('createOwnPlanBtn').addEventListener('click', () => {
    document.getElementById('planOutput').hidden = true;
    document.getElementById('ownPlanEditor').hidden = false;
    document.getElementById('ownPlanNotes').focus();
  });

  document.getElementById('saveOwnPlanBtn').addEventListener('click', () => {
    const updated = window.RavaStore.updateActiveProfile({ weeklyPlan: document.getElementById('ownPlanNotes').value });
    document.getElementById('ownPlanStatus').textContent = updated ? 'Your plan is saved with your profile.' : 'Your plan could not be saved in this browser.';
  });

  generateButton.addEventListener('click', () => {
    if (!allTargetsAreValid()) return;
    buildReport();
    window.RavaStore.updateActiveProfile({ units, reportGenerated: true });
    window.RavaStore.renderWorkflowProgress();
    syncReportState();
  });

  downloadButton.addEventListener('click', () => {
    const latest = window.RavaStore.getActiveProfile();
    if (!latest?.reportGenerated || !allTargetsAreValid() || window.RavaStore.calculateWorkflowProgress(latest) !== 100) return;
    const report = `RAVA ACADEMIC REPORT\n\n${reportOutput.innerText}\n`;
    const file = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rava-report-${window.RavaStore.firstName(profile.fullName).replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function initialize() {
    const name = window.RavaStore.firstName(profile.fullName);
    document.getElementById('findingsHeading').textContent = `${name}'s Findings & Recommendations`;
    document.getElementById('findingsIntro').textContent = `Your assessment, unit goals, and recommendations, brought together for ${profile.course}.`;
    document.getElementById('personalSummaryHeading').textContent = `${name}'s semester snapshot`;
    const efforts = [...(answers.q1 || []), ...(answers.q2 || [])];
    if (answers.q7) efforts.push(`Sleep: ${answers.q7}`);
    if (answers.q8) efforts.push(`Study: ${answers.q8}`);
    const struggles = [...(answers.q4 || []), ...(answers.q6 || [])];
    const strengths = [...(answers.q5 || [])];
    if (answers.q3) strengths.unshift(`Exam mindset: ${answers.q3}`);
    renderList('summaryEfforts', efforts, 'No study habits selected.');
    renderList('summaryStruggles', struggles, 'No specific challenge selected.');
    renderList('summaryStrengths', strengths, 'No strengths selected.');
    renderTargetForms();
    renderSummaryTargets();
    renderFindings();
    renderRecommendations();
    updateTargetStatus();
    if (activeProfile.reportGenerated && allTargetsAreValid()) buildReport();
    syncReportState();
    if (document.getElementById('ownPlanNotes')) document.getElementById('ownPlanNotes').value = activeProfile.weeklyPlan || '';
    window.RavaStore.renderWorkflowProgress();
  }

  function renderTargetForms() {
    targetForms.replaceChildren();
    if (!units.length) {
      targetForms.appendChild(makeElement('p', 'empty-state', 'No assessed units found. Return to Assessment and add the units for this semester.'));
      return;
    }

    units.forEach((unit, unitIndex) => {
      const card = makeElement('article', 'target-unit-card');
      const heading = makeElement('div', 'target-unit-heading');
      heading.append(makeElement('h3', '', unit.name), makeElement('span', 'component-count', `${unit.components.length} components`));
      const components = makeElement('div', 'target-component-list');
      unit.components.forEach((component, componentIndex) => {
        const row = makeElement('div', 'target-component-row');
        const label = makeElement('label', '', component.name);
        const input = document.createElement('input');
        const inputId = `target-${unitIndex}-${componentIndex}`;
        input.type = 'number';
        input.id = inputId;
        input.min = '0';
        input.max = String(component.outOf);
        input.step = '1';
        input.inputMode = 'numeric';
        input.placeholder = 'Your target';
        input.value = targetIsValid(component) ? String(component.target) : '';
        input.setAttribute('aria-label', `${unit.name}: ${component.name} target out of ${component.outOf}`);
        label.htmlFor = inputId;
        const group = makeElement('div', 'target-input-group');
        group.append(input, makeElement('span', 'component-maximum', `of ${component.outOf}`));
        row.append(label, group);
        components.appendChild(row);
        input.addEventListener('input', () => {
          component.target = input.value === '' ? null : Number(input.value);
          saveTargets();
        });
      });
      card.append(heading, components);
      targetForms.appendChild(card);
    });
  }

  initialize();
}