// --- LOGIC: CORE & STATE ---
const state = {
    subjectCount: 5,
    studentName: "", 
    subjects: [] 
};

// Classification System
const getClassification = (avg) => {
    if (avg < 10) return { text: "Insufficient", color: "#ff4757" };
    if (avg < 11) return { text: "Out of Danger", color: "#ffa502" };
    if (avg < 14) return { text: "Good", color: "#3742fa" };
    if (avg < 16) return { text: "Very Good", color: "#5352ed" };
    if (avg < 18) return { text: "Legendary", color: "#7b2cbf" }; 
    return { text: "Elite Mind", color: "#ffd32a" };
};

// --- DOM ELEMENTS ---
const views = {
    welcome: document.getElementById('view-welcome'),
    input: document.getElementById('view-input'),
    results: document.getElementById('view-results')
};

// --- NAVIGATION ---
const switchView = (viewName) => {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
};

document.getElementById('btn-back-home').addEventListener('click', () => switchView('welcome'));
document.getElementById('btn-back-input').addEventListener('click', () => switchView('input'));

// --- VIEW 1: WELCOME ---
const slider = document.getElementById('subject-slider');
const display = document.getElementById('subject-count-display');
const nameInput = document.getElementById('student-name'); 

// Capture Name
nameInput.addEventListener('input', (e) => {
    state.studentName = e.target.value;
});

slider.addEventListener('input', (e) => {
    state.subjectCount = parseInt(e.target.value);
    display.textContent = state.subjectCount;
});

document.getElementById('btn-start').addEventListener('click', () => {
    generateInputCards();
    switchView('input');
});

// --- VIEW 2: INPUT CARDS ---
const inputsContainer = document.getElementById('inputs-container');

function generateInputCards() {
    inputsContainer.innerHTML = ''; 
    state.subjects = [];

    for (let i = 1; i <= state.subjectCount; i++) {
        const id = i;
        // Initialize state with hasActivity flag
        state.subjects.push({ id: id, name: `Subject ${id}`, coeff: 1, examCount: 1, grades: [0], hasActivity: false });

        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="subject-header">
                <span class="subject-num">#${id}</span>
                <input type="text" id="name-${id}" value="Subject ${id}" placeholder="Subject Name">
            </div>
            
            <div class="control-group">
                <label style="color:#aaa; font-size:12px;">Coefficient: <span id="coeff-val-${id}" style="color:white; font-weight:bold;">1</span></label>
                <input type="range" id="coeff-${id}" min="1" max="10" value="1">
            </div>

            <div class="control-group">
                <label style="color:#aaa; font-size:12px;">Number of Exams</label>
                <div class="pill-selector" id="pills-${id}">
                    <div class="pill-option selected" data-val="1">1</div>
                    <div class="pill-option" data-val="2">2</div>
                    <div class="pill-option" data-val="3">3</div>
                    <div class="pill-option" data-val="4">4</div>
                </div>
            </div>

            <div style="margin-bottom: 10px;">
                <div id="btn-activity-${id}" class="pill-option" style="width: fit-content; padding: 8px 20px; margin: 0; margin-bottom: 5px;">
                    + Add Activity (25%)
                </div>
                <div id="activity-container-${id}"></div>
            </div>

            <div class="grades-inner-grid" id="grades-grid-${id}">
                <input type="number" class="grade-input" placeholder="Exam 1" min="0" max="20">
            </div>
        `;

        inputsContainer.appendChild(card);

        // Listeners
        const coeffSlider = card.querySelector(`#coeff-${id}`);
        coeffSlider.addEventListener('input', (e) => {
            document.getElementById(`coeff-val-${id}`).innerText = e.target.value;
            state.subjects[id-1].coeff = parseInt(e.target.value);
        });

        const nameInput = card.querySelector(`#name-${id}`);
        nameInput.addEventListener('input', (e) => state.subjects[id-1].name = e.target.value);

        const pills = card.querySelectorAll(`#pills-${id} .pill-option`);
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('selected'));
                pill.classList.add('selected');
                const count = parseInt(pill.dataset.val);
                state.subjects[id-1].examCount = count;
                updateGradeInputs(id, count);
            });
        });

        // NEW: Activity Button Listener
        const actBtn = card.querySelector(`#btn-activity-${id}`);
        actBtn.addEventListener('click', () => {
            const container = card.querySelector(`#activity-container-${id}`);
            const subject = state.subjects[id-1];

            if (!subject.hasActivity) {
                // Add Activity Field
                container.innerHTML = `<input type="number" id="activity-score-${id}" class="grade-input" placeholder="Activity Score (25%)" min="0" max="20" style="border: 1px solid var(--accent);">`;
                actBtn.innerText = "Remove Activity";
                actBtn.classList.add('selected'); 
                subject.hasActivity = true;
            } else {
                // Remove Activity Field
                container.innerHTML = '';
                actBtn.innerText = "+ Add Activity (25%)";
                actBtn.classList.remove('selected');
                subject.hasActivity = false;
            }
        });
    }
}

function updateGradeInputs(id, count) {
    const grid = document.getElementById(`grades-grid-${id}`);
    grid.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.className = 'grade-input';
        inp.placeholder = `Exam ${i}`;
        inp.min = 0; inp.max = 20;
        grid.appendChild(inp);
    }
}

// --- CALCULATION ---
document.getElementById('btn-calculate').addEventListener('click', () => {
    let totalWeighted = 0;
    let totalCoeff = 0;
    let hasError = false;

    for (let i = 1; i <= state.subjectCount; i++) {
        const grid = document.getElementById(`grades-grid-${i}`);
        const inputs = grid.querySelectorAll('input');
        
        // 1. Calculate Standard Exam Average
        let sumGrades = 0;
        let countGrades = 0;

        inputs.forEach(inp => {
            const val = parseFloat(inp.value);
            if (isNaN(val) || val < 0 || val > 20) {
                showToast(`Invalid exam grade in Subject #${i}`, 'error');
                hasError = true;
                return;
            }
            sumGrades += val;
            countGrades++;
        });

        if (hasError) return;
        if (countGrades === 0) {
            showToast(`Enter grades for Subject #${i}`, 'error');
            return;
        }

        let examAvg = sumGrades / countGrades;
        let finalSubjectAvg = examAvg;

        // 2. Check for Activity Score
        const subj = state.subjects[i-1];
        if (subj.hasActivity) {
            const actInput = document.getElementById(`activity-score-${i}`);
            const actVal = parseFloat(actInput.value);

            if (isNaN(actVal) || actVal < 0 || actVal > 20) {
                showToast(`Invalid activity score in Subject #${i}`, 'error');
                hasError = true;
                return;
            }

            // WEIGHTED CALCULATION: 75% Exams + 25% Activity
            finalSubjectAvg = (examAvg * 0.75) + (actVal * 0.25);
        }

        subj.average = finalSubjectAvg;
        subj.weightedScore = finalSubjectAvg * subj.coeff;
        
        totalWeighted += subj.weightedScore;
        totalCoeff += subj.coeff;
    }

    if (hasError) return;

    const finalAvg = totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
    const classification = getClassification(finalAvg);

    document.getElementById('final-score').innerText = finalAvg.toFixed(2);
    const badge = document.getElementById('classification-badge');
    badge.innerText = classification.text;
    badge.style.backgroundColor = classification.color;
    badge.style.color = '#2d3436'; 

    const list = document.getElementById('results-list');
    list.innerHTML = '';
    
    state.subjects.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div>
                <div class="res-name" style="font-weight:bold">${sub.name}</div>
                <div class="res-coeff" style="font-size:12px; color:#aaa">Coeff: ${sub.coeff} ${sub.hasActivity ? '<span style="color:var(--accent)">• Activity Included</span>' : ''}</div>
            </div>
            <div class="res-score">${sub.average.toFixed(2)}</div>
        `;
        list.appendChild(item);
    });

    state.finalResult = { avg: finalAvg, class: classification.text };
    switchView('results');
});

// --- THE LEGENDARY PDF GENERATOR ---
document.getElementById('btn-export').addEventListener('click', () => {
    showToast("Designing Masterpiece...", "success");
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    
    const C_BG = [252, 252, 255];
    const C_HEADER = [10, 10, 35];
    const C_ACCENT_1 = [93, 0, 168];
    const C_TEXT_MAIN = [40, 40, 50];
    const C_TEXT_MUTED = [120, 120, 130];
    const C_CARD_BG = [245, 247, 250];

    // 1. HEADER
    doc.setFillColor(...C_HEADER);
    doc.rect(0, 0, w, 65, "F"); 
    
    doc.setFillColor(...C_ACCENT_1);
    doc.circle(w, 0, 80, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC REPORT", 20, 25);
    
    // DISPLAY STUDENT NAME
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const studentName = state.studentName ? state.studentName.toUpperCase() : "STUDENT";
    doc.text(`PREPARED FOR: ${studentName}`, 20, 33);
    
    // DATE BADGE
    const date = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    
    doc.setFillColor(255, 255, 255); 
    doc.roundedRect(20, 42, 45, 8, 2, 2, "F");
    
    doc.setTextColor(...C_HEADER); 
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const dateWidth = doc.getTextWidth(formattedDate);
    doc.text(formattedDate, 20 + (45 - dateWidth) / 2, 47.5);


    // 2. HERO SCORE CARD
    const cardY = 55;
    const cardH = 35; 
    const cardW = 160;
    const cardX = (w - cardW) / 2;

    doc.setFillColor(200, 200, 210);
    doc.roundedRect(cardX+2, cardY+2, cardW, cardH, 4, 4, "F");
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "F");
    
    doc.setTextColor(...C_ACCENT_1);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text(state.finalResult.avg.toFixed(2), cardX + 15, cardY + 24);
    
    doc.setFontSize(12);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.text("/ 20", cardX + 55, cardY + 24);

    doc.setFillColor(...C_HEADER);
    doc.roundedRect(cardX + 90, cardY + 10, 60, 14, 7, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(state.finalResult.class.toUpperCase(), cardX + 120, cardY + 19, { align: "center" });

    // 3. SUBJECT LIST
    let y = 110;
    doc.setFontSize(11);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.setFont("helvetica", "bold");
    doc.text("SUBJECT", 25, y);
    doc.text("COEFFICIENT", 120, y, { align: "center" });
    doc.text("GRADE", 175, y, { align: "right" });
    
    y += 4;
    doc.setDrawColor(220, 220, 230);
    doc.line(20, y, w - 20, y);
    y += 10;

    state.subjects.forEach((sub, i) => {
        if (i % 2 === 0) {
            doc.setFillColor(...C_CARD_BG);
            doc.roundedRect(20, y - 6, w - 40, 12, 2, 2, "F");
        }

        doc.setFontSize(11);
        doc.setTextColor(...C_TEXT_MAIN);
        doc.setFont("helvetica", "bold");
        doc.text(sub.name, 25, y + 2.5);

        const coeffCenterX = 120;
        doc.setTextColor(60, 60, 70); 
        doc.setFontSize(11); 
        doc.setFont("helvetica", "bold");
        doc.text(sub.coeff.toString(), coeffCenterX, y + 2.5, { align: "center" });

        const isPass = sub.average >= 10;
        doc.setTextColor(...(isPass ? [46, 204, 113] : [231, 76, 60]));
        doc.setFontSize(11);
        doc.text(sub.average.toFixed(2), 175, y + 2.5, { align: "right" });

        y += 16;
    });

    // 4. FOOTER
    const footerY = h - 15;
    doc.setDrawColor(...C_HEADER);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, w - 20, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Academic Pro", 20, footerY);
    
    doc.setFont("helvetica", "bold");
    doc.text("POWERED BY KARIM DEV", w - 20, footerY, { align: "right" });

    // Save with Name in filename
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_") || "Student";
    doc.save(`Report_${safeName}_${Date.now()}.pdf`);
});

// Helper Toast
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.className = `toast show`;
    toast.style.borderColor = type === 'error' ? '#ff4757' : '#00b894';
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// Init
switchView('welcome');
