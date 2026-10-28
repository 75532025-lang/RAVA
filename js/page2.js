const activeProfile = window.RavaStore.getActiveProfile();
if (!activeProfile?.profileSaved || !activeProfile.assessmentComplete) {
  window.location.replace(activeProfile?.profileSaved ? '/pages/page1.html' : '/#profile-form');
} else {
  const profile = activeProfile.profile;
  const currentSemester = activeProfile.currentSemester || {};
  const previousUnits = Array.isArray(profile.previousSemester?.units) ? profile.previousSemester.units : [];
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

  const studyMethods = [
    { title: 'Run a 12-minute recall sprint', why: 'Pulling an idea from memory strengthens your ability to find it later and quickly reveals the exact part that still feels uncertain. It is a more useful check than rereading a page and mistaking familiarity for understanding.', method: 'Choose one concept, close your notes, and write or sketch everything you remember for 8 minutes. Spend 4 minutes checking the gaps and turn one gap into a question for your next session.' },
    { title: 'Climb a practice-question ladder', why: 'Moving from a warm-up question to a more demanding one builds confidence without hiding the steps that need work. A short sequence also gives you a clear sense of progress in one sitting.', method: 'Try one basic question, two standard problems, then one stretch question. Mark the first step that slowed you down and revisit that step before moving to a harder set.' },
    { title: 'Keep a tiny error detective log', why: 'Mistakes are most useful when you can see their pattern, such as a missed definition, rushed calculation, or unclear instruction. Naming the pattern gives your next practice session a specific purpose.', method: 'After a problem, note the topic, what went wrong, and the corrected first step in three short lines. Rework the question a day later without looking at the correction.' },
    { title: 'Space the same idea across the week', why: 'Returning to an idea after a little time has passed asks your memory to work again, which helps knowledge last longer than a single long cram session. Short reviews are also easier to fit around other units.', method: 'Give one topic a 15-minute review today, a 10-minute recall tomorrow, and a quick question set later in the week. Stop when you meet your planned time; consistency beats an exhausting marathon.' },
    { title: 'Teach it back in plain language', why: 'Explaining an idea simply makes hidden leaps in your understanding easier to notice. It also turns passive notes into a structure you can use when answering a question.', method: 'Explain one concept aloud as if helping a classmate, using a small example or sketch. When you get stuck, check only that section of your notes, then restart the explanation from the beginning.' }
  ];

  const challengeMethods = [
    { matches: ['Timed exams'], title: 'Practise a calm timed round', why: 'Short timed practice makes the exam format more familiar while keeping the pressure manageable. Reviewing the attempt afterward teaches pacing more reliably than timing alone.', method: 'Choose three representative questions and set a gentle time limit. Circle any question where you stalled, then retry it untimed and write down one pacing decision to test next time.' },
    { matches: ['Understanding concepts', "Didn't understand topics"], title: 'Build a concept map from one question', why: 'Connecting a definition to an example and a common mistake gives the idea more than one route into memory. It can also show whether the difficulty is vocabulary, a missing prerequisite, or an unclear process.', method: 'Put one concept in the middle of a page and connect it to a definition, a worked example, and one question you still have. Use the map to guide a focused help request or a short follow-up review.' },
    { matches: ['Cramming / Procrastination', 'Crammed last minute'], title: 'Make the first step almost too small', why: 'A tiny, clearly defined start lowers the effort of beginning and creates momentum without requiring a perfect study mood. Repeating small starts makes it less likely that revision piles up at the deadline.', method: 'Write a 15-minute task such as solving two questions or summarising one lecture. Put it beside an existing routine, and decide in advance whether to continue or stop when the timer ends.' },
    { matches: ['Sleep / Stress', 'Stressed / Slept badly'], title: 'Use a low-pressure recovery session', why: 'Attention and memory are harder to use when you are exhausted, so adding more hours can produce less learning. A shorter session protects rest while still keeping the unit familiar.', method: 'Pick one light task, such as reviewing flashcards or organising questions, and set a clear stopping time. Leave a short wind-down afterward; move demanding practice to a time when you feel more rested.' },
    { matches: ['Skipping CATs'], title: 'Turn CAT preparation into checkpoints', why: 'Several small checkpoints make it easier to notice weak topics before the assessment and reduce the need for last-minute catch-up. Each checkpoint produces something concrete to review.', method: 'Schedule two brief sessions before the next CAT: one for recalling key ideas and one for attempting questions. After each, choose a single gap to ask about or practise again.' },
    { matches: ['Too many units'], title: 'Rotate units with a visible finish line', why: 'A bounded task for each unit makes a busy week feel more navigable and reduces the time spent deciding what to do. Switching after a planned block also gives different subjects attention without pretending you can do everything at once.', method: 'Choose up to three units for a study day and write one finishable task beside each. Complete one focused block per unit, then stop and move the remaining tasks to another day.' },
    { matches: ["Didn't plan ahead"], title: 'Set up a 10-minute weekly reset', why: 'A quick look at deadlines and available time turns a vague intention into a workable sequence. Planning only the next few steps leaves room for changes rather than making the week feel overbooked.', method: 'At the start of the week, list deadlines, choose three priority tasks, and place short study blocks around existing commitments. Leave at least one buffer block for anything that takes longer than expected.' }
  ];

  function guideForUnit(unit) {
    const challenges = [...(answers.q4 || []), ...(answers.q6 || [])];
    const selected = challengeMethods.filter((guide) => guide.matches.some((item) => challenges.includes(item)));
    const previous = getPreviousUnit(unit.name);
    if (previous && previousGradeType(previous) === 'percent' && Number(previous.grade) < 60) {
      selected.push({
        title: 'Rebuild one foundation at a time',
        why: `Your previous ${unit.name} mark was ${previousGradeLabel(previous)}. Treat that as a clue about which foundations may need attention, not as a limit on what you can learn next.`,
        method: 'Choose one prerequisite topic, review a worked example, and solve two similar questions with notes available. Later, retry one question from memory and ask a tutor or classmate about the first step that still feels unclear.'
      });
    }
    studyMethods.forEach((guide) => {
      if (!selected.some((item) => item.title === guide.title)) selected.push({ ...guide });
    });
    return selected.slice(0, 2);
  }

  function appendRecommendationText(container, label, text, className) {
    const paragraph = makeElement('p', className);
    const strong = makeElement('strong', '', `${label}: `);
    paragraph.append(strong, document.createTextNode(text));
    container.appendChild(paragraph);
  }

  function renderRecommendations() {
    const container = document.getElementById('recommendationList');
    container.replaceChildren();
    units.forEach((unit, index) => {
      const group = makeElement('article', 'unit-recommendation-group');
      const heading = makeElement('div', 'unit-recommendation-heading');
      heading.append(
        makeElement('span', 'recommendation-number', String(index + 1).padStart(2, '0')),
        makeElement('h3', '', `${unit.name}: two ways forward`)
      );
      group.append(heading, makeElement('p', 'unit-recommendation-intro', 'Pick one method for your next study block, then mix in another when your focus needs a change of pace.'));
      const list = makeElement('ol', 'unit-recommendations');
      guideForUnit(unit).forEach((guide) => {
        const item = makeElement('li', 'unit-recommendation');
        item.appendChild(makeElement('h4', '', guide.title));
        appendRecommendationText(item, 'Why it helps', guide.why, 'recommendation-why');
        appendRecommendationText(item, 'How to try it', guide.method, 'recommendation-method');
        list.appendChild(item);
      });
      group.appendChild(list);
      container.appendChild(group);
    });
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

  function buildReport(showReport = true) {
    reportOutput.replaceChildren();
    reportOutput.hidden = !showReport;
    const reportHeader = makeElement('header', 'report-heading');
    reportHeader.append(
      makeElement('p', 'report-kicker', 'RAVA · YOUR SEMESTER FIELD GUIDE'),
      makeElement('h3', '', `A bright plan for ${window.RavaStore.firstName(profile.fullName)}`),
      makeElement('p', 'report-lead', `Prepared ${new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date())}. A practical snapshot of your goals, study patterns, and next steps.`)
    );
    reportOutput.appendChild(reportHeader);

    function appendReportSection(title, className) {
      const section = makeElement('section', `report-block ${className}`);
      section.appendChild(makeElement('h4', '', title));
      reportOutput.appendChild(section);
      return section;
    }

    const overview = appendReportSection('Your semester at a glance', 'report-overview');
    const overviewGrid = makeElement('div', 'report-overview-grid');
    [
      ['Course', profile.course],
      ['Study year', profile.yearOfStudy],
      ['Current term', `${currentSemester.semester}, ${currentSemester.academicYear}`],
      ['Units', String(units.length)]
    ].forEach(([label, value]) => {
      const stat = makeElement('div', 'report-stat');
      stat.append(makeElement('span', '', label), makeElement('strong', '', value));
      overviewGrid.appendChild(stat);
    });
    overview.appendChild(overviewGrid);

    const history = profile.previousSemester || {};
    const previousDetails = [history.academicYear, history.semester].filter(Boolean).join(' · ');
    if (previousDetails || previousUnits.length) {
      const previousSection = appendReportSection('A little context from last term', 'report-history');
      previousSection.appendChild(makeElement('p', '', previousDetails || 'Previous-term dates were not recorded.'));
    }
    const percentGrades = percentageHistory();
    if (percentGrades.length) {
      const average = percentGrades.reduce((total, unit) => total + Number(unit.grade), 0) / percentGrades.length;
      const historySection = reportOutput.querySelector('.report-history') || appendReportSection('A little context from last term', 'report-history');
      historySection.appendChild(makeElement('p', '', `Previous percentage grades averaged ${average.toFixed(1)}% across ${percentGrades.length} units. Treat that as a starting point, not a ceiling.`));
    }

    const pattern = appendReportSection('What your check-in says', 'report-pattern');
    pattern.appendChild(makeElement('p', '', document.getElementById('diagnosisText').textContent));

    const targetsSection = appendReportSection('Your unit targets', 'report-targets');
    const targets = makeElement('div', 'report-target-list');
    units.forEach((unit) => {
      const unitCard = makeElement('article', 'report-target-unit');
      unitCard.appendChild(makeElement('h5', '', unit.name));
      const componentList = document.createElement('ul');
      unit.components.forEach((component) => componentList.appendChild(makeElement('li', '', `${component.name}: aim for ${component.target} of ${component.outOf}`)));
      const previous = getPreviousUnit(unit.name);
      if (previous) unitCard.appendChild(makeElement('p', 'report-previous-mark', `Last result: ${previousGradeLabel(previous)}`));
      unitCard.appendChild(componentList);
      targets.appendChild(unitCard);
    });
    targetsSection.appendChild(targets);

    const recommendationsSection = appendReportSection('Two focused ideas for each unit', 'report-recommendations');
    document.querySelectorAll('.unit-recommendation-group').forEach((group) => {
      const unitRecommendations = makeElement('section', 'report-recommendation-unit');
      unitRecommendations.appendChild(makeElement('h5', '', group.querySelector('h3')?.textContent || 'Unit recommendations'));
      const list = document.createElement('ol');
      group.querySelectorAll('.unit-recommendation').forEach((item) => {
        const reportItem = document.createElement('li');
        reportItem.append(
          makeElement('h6', '', item.querySelector('h4')?.textContent || 'Study method'),
          makeElement('p', '', item.querySelector('.recommendation-why')?.textContent || ''),
          makeElement('p', '', item.querySelector('.recommendation-method')?.textContent || '')
        );
        list.appendChild(reportItem);
      });
      unitRecommendations.appendChild(list);
      recommendationsSection.appendChild(unitRecommendations);
    });

    const componentCount = units.reduce((count, unit) => count + unit.components.length, 0);
    const funFacts = appendReportSection('🎉 Fun facts & small wins', 'report-fun-facts');
    const factsList = document.createElement('ul');
    [
      `🎯 Your plan breaks ${units.length} ${units.length === 1 ? 'unit' : 'units'} into ${componentCount} clear component ${componentCount === 1 ? 'target' : 'targets'}. Pick one small next step and let the rest wait their turn.`,
      '🧠 A quick question from memory is called active recall. It helps you check what you can bring to mind before looking back at your notes.',
      '⏱️ The sample week adds up to 180 minutes across seven short sessions, about three hours total. You can move those sessions to fit your real week.'
    ].forEach((fact) => factsList.appendChild(makeElement('li', '', fact)));
    funFacts.appendChild(factsList);

    const savedWeeklyPlan = window.RavaStore.getActiveProfile()?.weeklyPlan;
    if (savedWeeklyPlan?.trim()) {
      const planSection = appendReportSection('Your weekly rhythm', 'report-weekly-plan');
      planSection.appendChild(makeElement('p', '', savedWeeklyPlan));
    }
    reportOutput.appendChild(makeElement('p', 'report-note', 'Small, repeatable steps add up. Adjust this guide to fit your week, celebrate progress, and keep going one useful session at a time.'));
  }

  function syncReportState() {
    const latest = window.RavaStore.getActiveProfile();
    const reportReady = Boolean(latest?.reportGenerated) && allTargetsAreValid();
    generateButton.disabled = !allTargetsAreValid();
    generateButton.textContent = reportReady
      ? reportOutput.hidden ? 'Show report' : 'Hide report'
      : 'Generate report';
    generateButton.setAttribute('aria-expanded', String(reportReady && !reportOutput.hidden));
    downloadButton.disabled = !reportReady || window.RavaStore.calculateWorkflowProgress(latest) !== 100;
    reportStatus.textContent = !allTargetsAreValid()
      ? 'Enter a valid target for every component before generating the report.'
      : reportReady
        ? 'Your report is ready to save as a PDF.'
        : 'Targets are complete. Generate the report to finish the final step.';
  }

  const samplePlanButton = document.getElementById('showSamplePlanBtn');
  const ownPlanButton = document.getElementById('createOwnPlanBtn');
  const samplePlanOutput = document.getElementById('planOutput');
  const ownPlanEditor = document.getElementById('ownPlanEditor');

  function setPlanButtonState(button, expanded, openText, closedText) {
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? openText : closedText;
  }

  function renderSampleWeek() {
    const schedule = [
      { day: 'Monday', theme: 'Kickoff', activity: 'Warm up with a quick recall sprint, then pick one question to get the week moving.', minutes: 25 },
      { day: 'Tuesday', theme: 'Practice lab', activity: 'Work through a small set of questions and note one useful mistake to learn from.', minutes: 30 },
      { day: 'Wednesday', theme: 'Switch the angle', activity: 'Teach a tricky idea back in plain language, using a sketch or example.', minutes: 20 },
      { day: 'Thursday', theme: 'Mini challenge', activity: 'Try a short timed round, then review the steps that felt smooth and the ones to revisit.', minutes: 30 },
      { day: 'Friday', theme: 'Progress check', activity: 'Redo one question from memory and give yourself credit for what is clearer now.', minutes: 20 },
      { day: 'Saturday', theme: 'Choose-your-focus', activity: 'Take one longer block for the unit that needs attention, with a proper break in the middle.', minutes: 45 },
      { day: 'Sunday', theme: 'Reset and recharge', activity: 'Keep it light: glance over the week, choose a first task for Monday, then enjoy your rest.', minutes: 10 }
    ];
    const grid = makeElement('div', 'week-plan-grid');
    const planLines = [];
    schedule.forEach((item, index) => {
      const unit = units[index % units.length];
      const unitName = unit?.name || 'a priority unit';
      const card = makeElement('article', 'week-plan-day');
      card.append(
        makeElement('p', 'week-plan-day-label', item.day),
        makeElement('h4', '', item.theme),
        makeElement('p', 'week-plan-unit', unitName),
        makeElement('p', 'week-plan-activity', item.activity),
        makeElement('span', 'week-plan-time', `${item.minutes} min`)
      );
      grid.appendChild(card);
      planLines.push(`${item.day} · ${item.theme} (${item.minutes} min) — ${unitName}. ${item.activity}`);
    });
    samplePlanOutput.append(
      makeElement('h3', '', 'A week with room to breathe'),
      makeElement('p', 'week-plan-intro', 'Short, varied sessions keep the week moving. Swap days around when life happens; the goal is a rhythm, not a perfect streak.'),
      grid
    );
    const updated = window.RavaStore.updateActiveProfile({ weeklyPlan: planLines.join('\n'), reportGenerated: false });
    if (updated) {
      reportOutput.replaceChildren();
      reportOutput.hidden = true;
      syncReportState();
    }
  }

  samplePlanButton.addEventListener('click', () => {
    if (!samplePlanOutput.hidden) {
      samplePlanOutput.hidden = true;
      setPlanButtonState(samplePlanButton, false, 'Hide sample week', 'Show a sample week');
      return;
    }
    if (!samplePlanOutput.childElementCount) renderSampleWeek();
    ownPlanEditor.hidden = true;
    setPlanButtonState(ownPlanButton, false, 'Hide my plan', 'Write my own plan');
    samplePlanOutput.hidden = false;
    setPlanButtonState(samplePlanButton, true, 'Hide sample week', 'Show a sample week');
  });

  ownPlanButton.addEventListener('click', () => {
    if (!ownPlanEditor.hidden) {
      ownPlanEditor.hidden = true;
      setPlanButtonState(ownPlanButton, false, 'Hide my plan', 'Write my own plan');
      return;
    }
    samplePlanOutput.hidden = true;
    setPlanButtonState(samplePlanButton, false, 'Hide sample week', 'Show a sample week');
    ownPlanEditor.hidden = false;
    setPlanButtonState(ownPlanButton, true, 'Hide my plan', 'Write my own plan');
    document.getElementById('ownPlanNotes').focus();
  });

  document.getElementById('saveOwnPlanBtn').addEventListener('click', () => {
    const updated = window.RavaStore.updateActiveProfile({ weeklyPlan: document.getElementById('ownPlanNotes').value, reportGenerated: false });
    document.getElementById('ownPlanStatus').textContent = updated ? 'Your plan is saved with your profile.' : 'Your plan could not be saved in this browser.';
    if (updated) {
      reportOutput.replaceChildren();
      reportOutput.hidden = true;
      syncReportState();
    }
  });

  generateButton.addEventListener('click', () => {
    if (!allTargetsAreValid()) return;
    const latest = window.RavaStore.getActiveProfile();
    if (latest?.reportGenerated && reportOutput.childElementCount) {
      reportOutput.hidden = !reportOutput.hidden;
      syncReportState();
      return;
    }
    buildReport();
    window.RavaStore.updateActiveProfile({ units, reportGenerated: true });
    window.RavaStore.renderWorkflowProgress();
    syncReportState();
  });

  downloadButton.addEventListener('click', () => {
    const latest = window.RavaStore.getActiveProfile();
    if (!latest?.reportGenerated || !allTargetsAreValid() || window.RavaStore.calculateWorkflowProgress(latest) !== 100) return;
    const oldTitle = document.title;
    const safeName = window.RavaStore.firstName(profile.fullName).replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    document.title = `RAVA-semester-guide-${safeName}`;
    window.addEventListener('afterprint', () => { document.title = oldTitle; }, { once: true });
    reportStatus.textContent = 'In the print dialog, choose Save as PDF to download your report.';
    window.print();
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
    if (activeProfile.reportGenerated && allTargetsAreValid()) buildReport(false);
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