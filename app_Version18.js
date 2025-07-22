// ==== DEMO DATA: Simulate med change history (replace with your real localStorage logic) ====
const medHistory = [
  {
    date: "2025-07-21T12:34:56.000Z",
    meds: [
      { name: "par", dosage: "2", times: ["08:34"], notes: "" }
    ],
    reason: "Initial"
  },
  {
    date: "2025-07-22T09:00:00.000Z",
    meds: [
      { name: "par", dosage: "2", times: ["08:34"], notes: "" },
      { name: "yu", dosage: "2", times: ["16:59", "20:59"], notes: "" }
    ],
    reason: "yu was added"
  },
  {
    date: "2025-07-22T15:00:00.000Z",
    meds: [
      { name: "par", dosage: "2", times: ["08:34","12:00"], notes: "" },
      { name: "yu", dosage: "2", times: ["16:59", "20:59"], notes: "" }
    ],
    reason: "par: Times updated"
  }
];

// ==== END DEMO DATA ====

// --- Util
function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

// --- Sidebar of change dates
function renderSidebar() {
  const list = document.getElementById('changeDatesList');
  list.innerHTML = '';
  medHistory.slice(1).forEach((entry, idx) => {
    const li = document.createElement('li');
    li.textContent = formatDate(entry.date);
    li.onclick = () => renderChangeDetail(idx+1);
    li.id = `change-date-li-${idx+1}`;
    list.appendChild(li);
  });
}

// --- Diff logic
function diffMedLists(before, after) {
  function mKey(m) { return m.name.toLowerCase(); }
  const beforeMap = Object.fromEntries(before.map(m => [mKey(m), m]));
  const afterMap = Object.fromEntries(after.map(m => [mKey(m), m]));
  const added = [];
  const removed = [];
  const changed = [];
  for (const key in beforeMap) {
    if (!afterMap[key]) removed.push(beforeMap[key]);
    else {
      const o = beforeMap[key], n = afterMap[key];
      let diffs = [];
      if (o.dosage !== n.dosage) diffs.push('dosage');
      if (JSON.stringify(o.times) !== JSON.stringify(n.times)) diffs.push('times');
      if ((o.notes||"") !== (n.notes||"")) diffs.push('notes');
      if (diffs.length) changed.push({name: n.name, before: o, after: n, fields: diffs});
    }
  }
  for (const key in afterMap) {
    if (!beforeMap[key]) added.push(afterMap[key]);
  }
  return {added, removed, changed};
}

// --- Render change details for a given history index
function renderChangeDetail(idx) {
  // Highlight selected
  document.querySelectorAll('#changeDatesList li').forEach(li => li.classList.remove('active'));
  const activeLi = document.getElementById(`change-date-li-${idx}`);
  if (activeLi) activeLi.classList.add('active');

  const before = medHistory[idx-1].meds;
  const after = medHistory[idx].meds;
  const diff = diffMedLists(before, after);
  const container = document.getElementById('changeHistoryDetail');
  let html = `<div class="med-change-entry">
    <div class="med-change-title">${formatDate(medHistory[idx].date)} &mdash; 
      ${diff.added.length ? `<span style="color:green;">${diff.added.map(m=>m.name).join(', ')} was added</span>` : ""}
      ${diff.removed.length ? `<span style="color:red;">${diff.removed.map(m=>m.name).join(', ')} was removed</span>` : ""}
      ${diff.changed.length ? diff.changed.map(ch => `<span style="color:orange;">${ch.name}: ${ch.fields.map(f=>f.charAt(0).toUpperCase()+f.slice(1)).join(', ')}</span>`).join('') : ""}
    </div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div>
        <b>Before</b>
        <div id="before-table"></div>
        <button class="export-btn" onclick="exportMedListTable('before-table')">Export Before (PDF)</button>
      </div>
      <div>
        <b>After</b>
        <div id="after-table"></div>
        <button class="export-btn" onclick="exportMedListTable('after-table')">Export After (PDF)</button>
      </div>
    </div>
  </div>`;
  container.innerHTML = html;
  // Render tables with highlights
  renderMedListTable('before-table', before, diff, "before");
  renderMedListTable('after-table', after, diff, "after");
}

// --- Render med table with highlights
function renderMedListTable(containerId, meds, diff, side) {
  let html = `<table class="medlist-table"><tr><th>Name</th><th>Dosage</th><th>Times</th><th>Notes</th></tr>`;
  meds.forEach(m => {
    let trClass = '';
    if (side === "before" && diff.removed.some(x => x.name === m.name)) trClass = 'diff-removed';
    if (side === "after" && diff.added.some(x => x.name === m.name)) trClass = 'diff-added';
    let td0 = '', td1 = '', td2 = '', td3 = '';
    if (diff.changed.some(x => x.name === m.name)) {
      const ch = diff.changed.find(x => x.name === m.name);
      if (ch.fields.includes('dosage')) td1 = 'class="diff-highlight"';
      if (ch.fields.includes('times')) td2 = 'class="diff-highlight"';
      if (ch.fields.includes('notes')) td3 = 'class="diff-highlight"';
    }
    html += `<tr class="${trClass}"><td>${m.name}</td>
      <td ${td1}>${m.dosage}</td>
      <td ${td2}>${(m.times||[]).join(', ')}</td>
      <td ${td3}>${m.notes||''}</td></tr>`;
  });
  html += "</table>";
  document.getElementById(containerId).innerHTML = html;
}

// --- Export to PDF using html2canvas + jspdf
window.exportMedListTable = function(divId) {
  const node = document.getElementById(divId);
  html2canvas(node).then(canvas => {
    const imgData = canvas.toDataURL("image/jpeg");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("medication-list.pdf");
  });
};

// --- INITIALIZE
renderSidebar();
renderChangeDetail(1);
