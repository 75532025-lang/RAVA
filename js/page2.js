let unitsList = [];

const unitNameInput = document.getElementById('unitNameInput');
const templateSelect = document.getElementById('templateSelect');
const addUnitBtn = document.getElementById('addUnitBtn');
const recordedUnitsContainer = document.getElementById('recordedUnitsContainer');
const overallValidation = document.getElementById('overallValidation');

if (unitNameInput && templateSelect && addUnitBtn && recordedUnitsContainer && overallValidation) {
  addUnitBtn.addEventListener('click', () => {
    const name = unitNameInput.value.trim();
    const template = templateSelect.value;

    if (!name) {
      alert('Please enter a unit name.');
      return;
    }

    let components = [];

    if (template === '70/30') {
      components = [
        { name: 'Exam', outOf: 70, target: 50 },
        { name: 'CATs', outOf: 30, target: 20 }
      ];
    } else if (template === '60/40') {
      components = [
        { name: 'Exam', outOf: 60, target: 40 },
        { name: 'CATs', outOf: 40, target: 25 }
      ];
    } else if (template === '50/50') {
      components = [
        { name: 'Exam', outOf: 50, target: 35 },
        { name: 'CATs', outOf: 50, target: 35 }
      ];
    } else if (template === 'custom') {
      components = [
        { name: 'Exam', outOf: 50, target: 35 },
        { name: 'CATs', outOf: 30, target: 20 },
        { name: 'Practical', outOf: 20, target: 15 }
      ];
    }

    const unit = {
      id: Date.now(),
      name,
      template,
      components
    };

    unitsList.push(unit);
    unitNameInput.value = '';
    renderUnits();
  });

  window.removeUnit = function (unitId) {
    unitsList = unitsList.filter((unit) => unit.id !== unitId);
    renderUnits();
  };

  function renderUnits() {
    recordedUnitsContainer.innerHTML = '';

    if (unitsList.length === 0) {
      recordedUnitsContainer.innerHTML = '<p class="text-slate-400 text-sm italic">No units added yet. Enter a unit above to build your targets.</p>';
      overallValidation.textContent = 'Awaiting Units';
      overallValidation.className = 'bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold';
      return;
    }

    let allValid = true;

    unitsList.forEach((unit) => {
      const totalOutOf = unit.components.reduce((sum, component) => sum + component.outOf, 0);
      const isValid = totalOutOf === 100;

      if (!isValid) {
        allValid = false;
      }

      const cardClasses = isValid
        ? 'border-emerald-200 bg-emerald-50/30'
        : 'border-rose-200 bg-rose-50/30';

      const statusBadge = isValid
        ? '<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-semibold">100/100 Valid</span>'
        : `<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-xs font-semibold">Total: ${totalOutOf}/100 - Must be 100</span>`;

      const componentsHtml = unit.components
        .map(
          (component) => `
            <div class="flex justify-between items-center text-xs text-slate-600 bg-white/60 px-3 py-1.5 rounded border border-slate-200/60">
              <span class="font-medium">${component.name}</span>
              <span>Target: <strong class="text-slate-900">${component.target}</strong> / Out of: <strong class="text-slate-900">${component.outOf}</strong></span>
            </div>
          `
        )
        .join('');

      const unitCard = document.createElement('div');
      unitCard.className = `p-4 rounded-xl border ${cardClasses} space-y-3`;
      unitCard.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="flex items-center gap-3">
            <h4 class="font-semibold text-slate-900 text-md">${unit.name}</h4>
            ${statusBadge}
          </div>
          <button onclick="removeUnit(${unit.id})" class="text-xs text-rose-600 hover:text-rose-800 font-medium px-3 py-1.5 bg-white border border-rose-200 rounded-lg shadow-2xs w-fit">(-) Remove Unit</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          ${componentsHtml}
        </div>
      `;

      recordedUnitsContainer.appendChild(unitCard);
    });

    if (allValid) {
      overallValidation.textContent = 'All Units Valid (100/100)';
      overallValidation.className = 'bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold';
    } else {
      overallValidation.textContent = 'Fix Unit Totals to 100';
      overallValidation.className = 'bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-semibold';
    }
  }
}
let quizAnswers = { q1: [], q2: [], q3: "", q4: [], q5: [], q6: [], q7: "", q8: "" };
window.quizAnswers = quizAnswers;

const quizButtons = document.querySelectorAll('[class*="quiz-opt-"]');

quizButtons.forEach(button => {
button.addEventListener('click', () => {
const qKey = button.getAttribute('data-question');
const textSpan = button.querySelector('span:first-child');
const optionText = textSpan ? textSpan.textContent.trim() : button.textContent.trim();
const indicator = button.querySelector('span:last-child');


const isMulti = ['q1', 'q2', 'q4', 'q5', 'q6'].includes(qKey);

if (isMulti) {
  const index = quizAnswers[qKey].indexOf(optionText);
  if (index > -1) {
    quizAnswers[qKey].splice(index, 1);
    button.classList.remove('border-indigo-600', 'bg-indigo-50', 'text-indigo-900');
    button.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
    if (indicator) {
      indicator.className = "w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-400 flex items-center justify-center";
      indicator.innerHTML = "";
    }
  } else {
    quizAnswers[qKey].push(optionText);
    button.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700');
    button.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-900');
    if (indicator) {
      indicator.className = "w-4 h-4 rounded-full border border-indigo-600 bg-indigo-600 flex items-center justify-center text-white text-xs";
      indicator.innerHTML = "&#10003;";
    }
  }
} else {
  const siblingButtons = document.querySelectorAll(`[data-question="${qKey}"]`);
  siblingButtons.forEach(sib => {
    sib.classList.remove('border-indigo-600', 'bg-indigo-50', 'text-indigo-900');
    sib.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700');
    const sibInd = sib.querySelector('span:last-child');
    if (sibInd) {
      sibInd.className = "w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-400 flex items-center justify-center";
      sibInd.innerHTML = "";
    }
  });

  quizAnswers[qKey] = optionText;
  button.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700');
  button.classList.add('border-indigo-600', 'bg-indigo-50', 'text-indigo-900');
  if (indicator) {
    indicator.className = "w-4 h-4 rounded-full border border-indigo-600 bg-indigo-600 flex items-center justify-center text-white text-xs";
    indicator.innerHTML = "&#10003;";
  }
}



});
});
function updateLiveSummary() {
const summaryTargets = document.getElementById('summaryTargets');
const summaryEfforts = document.getElementById('summaryEfforts');
const summaryStruggles = document.getElementById('summaryStruggles');
const summaryStrengths = document.getElementById('summaryStrengths');

if (!summaryTargets || !summaryEfforts || !summaryStruggles || !summaryStrengths) return;

if (unitsList.length === 0) {
summaryTargets.innerHTML = "Add units in Part B to see your targets.";
} else {
let targetHtml = '';
unitsList.forEach(u => {
let totalTarget = u.components.reduce((sum, c) => sum + c.target, 0);
targetHtml += `<li><strong>${u.name}</strong>: Target score ${totalTarget}/100</li>`;
});
targetHtml += '';
summaryTargets.innerHTML = targetHtml;
}

let effortsItems = [];
if (typeof quizAnswers !== 'undefined') {
if (quizAnswers.q1 && quizAnswers.q1.length > 0) effortsItems.push(...quizAnswers.q1);
if (quizAnswers.q2 && quizAnswers.q2.length > 0) effortsItems.push(...quizAnswers.q2);
if (quizAnswers.q7) effortsItems.push(`Sleeps ${quizAnswers.q7} daily`);
if (quizAnswers.q8) effortsItems.push(`Studies ${quizAnswers.q8} per day`);
}

if (effortsItems.length === 0) {
summaryEfforts.innerHTML = "Complete the quiz above to see your efforts.";
} else {
summaryEfforts.innerHTML = '' + effortsItems.map(i => `<li>${i}</li>`).join('') + '';
}

let strugglesItems = [];
if (typeof quizAnswers !== 'undefined') {
if (quizAnswers.q4 && quizAnswers.q4.length > 0) strugglesItems.push(...quizAnswers.q4);
if (quizAnswers.q6 && quizAnswers.q6.length > 0) strugglesItems.push(...quizAnswers.q6);
}

if (strugglesItems.length === 0) {
summaryStruggles.innerHTML = "Complete the quiz above to see your challenges.";
} else {
summaryStruggles.innerHTML = '' + strugglesItems.map(i => `<li>${i}</li>`).join('') + '';
}

let strengthsItems = [];
if (typeof quizAnswers !== 'undefined') {
if (quizAnswers.q3) strengthsItems.push(`Exam mindset: ${quizAnswers.q3}`);
if (quizAnswers.q5 && quizAnswers.q5.length > 0) strengthsItems.push(...quizAnswers.q5);
}

if (strengthsItems.length === 0) {
summaryStrengths.innerHTML = "Complete the quiz above to see your strengths.";
} else {
summaryStrengths.innerHTML = '' + strengthsItems.map(i => `<li>${i}</li>`).join('') + '';
}
}

function checkReportGate() {
const getReportBtn = document.getElementById('getReportBtn');
const reportStatusMsg = document.getElementById('reportStatusMsg');
if (!getReportBtn || !reportStatusMsg) return;

const allValid = unitsList.length > 0 && unitsList.every(u => {
let totalOutOf = u.components.reduce((sum, c) => sum + c.outOf, 0);
return totalOutOf === 100;
});

if (allValid) {
getReportBtn.disabled = false;
reportStatusMsg.textContent = "Ready! Click to generate your custom academic plan.";
} else {
getReportBtn.disabled = true;
reportStatusMsg.textContent = "Ensure all unit targets equal 100/100 to unlock your report.";
}
}

if (typeof renderUnits === 'function') {
const _superRenderUnits = renderUnits;
renderUnits = function() {
_superRenderUnits();
checkReportGate();
updateLiveSummary();
};
}

document.querySelectorAll('[class*="quiz-opt-"]').forEach(btn => {
btn.addEventListener('click', () => {
updateLiveSummary();
});
});

const getReportBtn = document.getElementById('getReportBtn');
if (getReportBtn) {
getReportBtn.addEventListener('click', () => {
getReportBtn.disabled = true;
const originalText = getReportBtn.textContent;
getReportBtn.textContent = "Putting together your personal plan...";

setTimeout(() => {
  getReportBtn.textContent = originalText;
  getReportBtn.disabled = false;
  alert("Success! Your personal academic report has been successfully generated.");
}, 2500);

});
}

updateLiveSummary();
checkReportGate();