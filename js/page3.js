const activeProfile = window.RavaStore.getActiveProfile();
if (!activeProfile?.profileSaved || !activeProfile.assessmentComplete) {
  window.location.replace(activeProfile?.profileSaved ? 'page2.html' : 'page1.html#profile-form');
} else {
  const profile = activeProfile.profile;
  const currentSemester = activeProfile.currentSemester || {};
  const previousSemester = profile.previousSemester || {};
  const previousUnits = Array.isArray(previousSemester.units) ? previousSemester.units : [];
  const units = Array.isArray(activeProfile.units) ? activeProfile.units : [];
  const answers = activeProfile.quizAnswers || {};
  const assessmentIsComplete = activeProfile.assessmentComplete && units.length > 0;
  const generateButton = document.getElementById('generateReportBtn');
  const downloadButton = document.getElementById('downloadReportBtn');
  const reportStatus = document.getElementById('reportStatus');
  const reportOutput = document.getElementById('reportOutput');

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderProfile() {
    document.getElementById('findingsHeading').textContent = `${profile.fullName}'s Findings & Recommendations`;
    document.getElementById('findingsIntro').textContent = `A practical plan for ${profile.course}, ${profile.yearOfStudy}, informed by your current assessment and previous results.`;
    document.getElementById('findingUniversity').textContent = profile.university;
    document.getElementById('findingCourse').textContent = profile.course;
    document.getElementById('findingStudyYear').textContent = profile.yearOfStudy;
    document.getElementById('findingAcademicYear').textContent = currentSemester.academicYear || 'Not set';
    document.getElementById('findingSemester').textContent = currentSemester.semester || 'Not set';
  }

  function renderFindings() {
    const challenges = [...(answers.q4 || []), ...(answers.q6 || [])];
    const strengths = [...(answers.q5 || [])];
    const habits = [...(answers.q1 || []), ...(answers.q2 || [])];
    const tone = answers.q3 ? `You described your exam mindset as ${answers.q3.toLowerCase()}.` : '';
    const challengeText = challenges.length ? `The main friction points are ${challenges.join(', ').toLowerCase()}.` : 'You have not marked a specific challenge.';
    const strengthText = strengths.length ? `Build on strengths such as ${strengths.join(', ').toLowerCase()}.` : 'Add a strength during your check-in to make the plan more specific.';
    const habitsText = habits.length ? `Your selected habits and study times include ${habits.join(', ').toLowerCase()}.` : '';
    const sleepText = answers.q7 ? `You reported sleeping ${answers.q7.toLowerCase()}.` : '';
    const studyText = answers.q8 ? `Your current study time is ${answers.q8.toLowerCase()} per day.` : '';
    const previousAverage = previousUnits.length
      ? previousUnits.reduce((total, unit) => total + Number(unit.grade), 0) / previousUnits.length
      : null;
    const previousContext = previousAverage === null
      ? 'No previous unit grades were entered.'
      : `Your previous semester average was ${previousAverage.toFixed(1)}% across ${previousUnits.length} ${previousUnits.length === 1 ? 'unit' : 'units'}.`;
    document.getElementById('diagnosisText').textContent = [tone, previousContext, challengeText, strengthText, habitsText, sleepText, studyText].filter(Boolean).join(' ');

    const previousDetails = [previousSemester.studyYear, previousSemester.academicYear, previousSemester.semester].filter(Boolean);
    document.getElementById('previousSemesterDetails').textContent = previousDetails.length
      ? previousDetails.join(' · ')
      : 'No previous-semester details were recorded on Home.';
    const previousResults = document.getElementById('previousUnitsResults');
    previousResults.replaceChildren();
    if (!previousUnits.length) {
      previousResults.appendChild(makeElement('p', 'empty-history', 'No previous unit grades were added.'));
    } else {
      previousUnits.forEach((unit) => {
        const result = makeElement('article', 'previous-unit-result');
        result.append(makeElement('h3', '', unit.name), makeElement('strong', '', `${unit.grade}%`));
        previousResults.appendChild(result);
      });
    }

    const chip = document.getElementById('assessmentResultChip');
    chip.textContent = `${units.length} ${units.length === 1 ? 'unit' : 'units'} assessed`;
    const unitFindings = document.getElementById('unitFindings');
    units.forEach((unit) => {
      const item = makeElement('article', 'unit-finding');
      item.appendChild(makeElement('h3', '', unit.name));
      const targets = makeElement('ul', 'finding-targets');
      const previousUnit = previousUnits.find((candidate) => candidate.name.toLocaleLowerCase() === unit.name.toLocaleLowerCase());
      if (previousUnit) targets.appendChild(makeElement('li', '', `Previous result: ${previousUnit.grade}%`));
      unit.components.forEach((component) => {
        targets.appendChild(makeElement('li', '', `${component.name}: target ${component.target} of ${component.outOf}`));
      });
      item.appendChild(targets);
      unitFindings.appendChild(item);
    });
  }

  function renderRecommendations() {
    const mappings = [
      ['Timed exams', 'Build exam pacing', 'Complete short timed question sets, then review where time was lost before attempting a full paper.'],
      ['Understanding concepts', 'Use active recall', 'Close your notes, explain the idea in your own words, and check gaps against the source material.'],
      ['Cramming / Procrastination', 'Space practice across the week', 'Schedule small review blocks several days apart and start with a ten-minute task when focus is low.'],
      ['Sleep / Stress', 'Protect recovery time', 'Set a consistent wind-down routine and leave a short buffer between study and sleep.'],
      ['Skipping CATs', 'Make assessment prep smaller', 'Add two brief practice sessions before each CAT and track one topic at a time.'],
      ['Too many units', 'Rotate subjects deliberately', 'Plan a manageable number of subjects per day and alternate demanding work with lighter review.'],
      ['Crammed last minute', 'Replace cramming with spaced review', 'Revisit lecture material in short intervals throughout the week instead of reserving it for the night before.'],
      ["Didn't understand topics", 'Ask for help early', 'Write down the exact point of confusion and bring it to office hours, a tutor, or a study group.'],
      ["Didn't plan ahead", 'Use a weekly reset', 'At the start of each week, list deadlines and reserve realistic blocks for each unit.']
    ];
    const selected = mappings.filter(([key]) => (answers.q4 || []).concat(answers.q6 || []).some((response) => response.toLowerCase() === key.toLowerCase()));
    const recommendations = selected.length ? selected : [
      ['General', 'Keep a steady review rhythm', 'Use active recall and short spaced sessions for each unit, and leave time for rest.']
    ];
    const container = document.getElementById('recommendationList');
    recommendations.forEach(([, title, text], index) => {
      const card = makeElement('article', 'recommendation-item');
      card.append(makeElement('span', 'recommendation-number', String(index + 1)), makeElement('h3', '', title), makeElement('p', '', text));
      container.appendChild(card);
    });
  }

  function makeReport() {
    reportOutput.replaceChildren();
    reportOutput.hidden = false;
    reportOutput.appendChild(makeElement('h3', '', `Academic plan for ${profile.fullName}`));
    reportOutput.appendChild(makeElement('p', '', `${profile.university} · ${profile.course} · ${profile.yearOfStudy} · ${currentSemester.academicYear}, ${currentSemester.semester}`));
    reportOutput.appendChild(makeElement('h4', '', 'Previous semester'));
    reportOutput.appendChild(makeElement('p', '', [previousSemester.studyYear, previousSemester.academicYear, previousSemester.semester].filter(Boolean).join(' · ') || 'No previous-semester details recorded.'));
    const previousList = document.createElement('ul');
    if (previousUnits.length) {
      previousUnits.forEach((unit) => previousList.appendChild(makeElement('li', '', `${unit.name}: ${unit.grade}%`)));
    } else {
      previousList.appendChild(makeElement('li', '', 'No previous unit grades entered.'));
    }
    reportOutput.appendChild(previousList);
    reportOutput.appendChild(makeElement('h4', '', 'Unit targets'));
    const unitList = document.createElement('ul');
    units.forEach((unit) => {
      const breakdown = unit.components.map((component) => `${component.name}: ${component.target}/${component.outOf}`).join('; ');
      unitList.appendChild(makeElement('li', '', `${unit.name} — ${breakdown}`));
    });
    reportOutput.appendChild(unitList);
    reportOutput.appendChild(makeElement('h4', '', 'Study reflection'));
    reportOutput.appendChild(makeElement('p', '', document.getElementById('diagnosisText').textContent));
    reportOutput.appendChild(makeElement('h4', '', 'Recommendations'));
    const recommendationList = document.createElement('ul');
    document.querySelectorAll('.recommendation-item h3').forEach((item) => recommendationList.appendChild(makeElement('li', '', item.textContent)));
    reportOutput.appendChild(recommendationList);
  }

  function syncReportState() {
    const reportReady = Boolean(window.RavaStore.getActiveProfile()?.reportGenerated);
    generateButton.disabled = !assessmentIsComplete;
    downloadButton.disabled = !reportReady || window.RavaStore.calculateWorkflowProgress(window.RavaStore.getActiveProfile()) !== 100;
    reportStatus.textContent = !assessmentIsComplete
      ? 'Complete the assessment before generating your report.'
      : reportReady
        ? 'Report generated. Your progress is complete and the download is ready.'
        : 'Generate your report to complete the final step and unlock the download.';
  }

  generateButton.addEventListener('click', () => {
    if (!assessmentIsComplete) return;
    makeReport();
    window.RavaStore.updateActiveProfile({ reportGenerated: true });
    window.RavaStore.renderWorkflowProgress();
    syncReportState();
  });

  downloadButton.addEventListener('click', () => {
    const current = window.RavaStore.getActiveProfile();
    if (!current?.reportGenerated || window.RavaStore.calculateWorkflowProgress(current) !== 100) return;
    const content = `RAVA ACADEMIC REPORT\n\n${reportOutput.innerText}\n`;
    const reportFile = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const fileUrl = URL.createObjectURL(reportFile);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `rava-report-${profile.fullName.trim().replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  });

  const planOutput = document.getElementById('planOutput');
  const ownPlanEditor = document.getElementById('ownPlanEditor');
  const ownPlanNotes = document.getElementById('ownPlanNotes');
  const ownPlanStatus = document.getElementById('ownPlanStatus');
  if (ownPlanNotes) ownPlanNotes.value = activeProfile.weeklyPlan || '';

  document.getElementById('showSamplePlanBtn').addEventListener('click', () => {
    planOutput.replaceChildren();
    planOutput.hidden = false;
    ownPlanEditor.hidden = true;
    planOutput.appendChild(makeElement('h3', '', 'A flexible week to adapt'));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const list = document.createElement('ul');
    days.forEach((day, index) => {
      const unit = units[index % units.length];
      const activity = index === 6 ? 'Rest and review the week' : `Review ${unit.name} with active recall`;
      list.appendChild(makeElement('li', '', `${day}: ${activity}`));
    });
    planOutput.appendChild(list);
  });

  document.getElementById('createOwnPlanBtn').addEventListener('click', () => {
    planOutput.hidden = true;
    ownPlanEditor.hidden = false;
    ownPlanNotes.focus();
  });

  document.getElementById('saveOwnPlanBtn').addEventListener('click', () => {
    const updated = window.RavaStore.updateActiveProfile({ weeklyPlan: ownPlanNotes.value });
    ownPlanStatus.textContent = updated ? 'Your plan is saved with your profile.' : 'Your plan could not be saved in this browser.';
  });

  renderProfile();
  renderFindings();
  renderRecommendations();
  if (activeProfile.reportGenerated) makeReport();
  syncReportState();
  window.RavaStore.renderWorkflowProgress();
}