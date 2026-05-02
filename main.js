/* ═══════════════════════════════════════════════════════════
   Student Grade Lookup — Application Logic
═══════════════════════════════════════════════════════════ */

let students = [];

/* ─── Load JSON Data ────────────────────────────────────── */
async function loadStudents() {
  const indicator = document.getElementById('loadingIndicator');
  indicator.innerHTML = '<span class="loading-pulse">⏳ جاري تحميل بيانات الطلاب...</span>';

  try {
    const response = await fetch('students.json');
    if (!response.ok) throw new Error('فشل تحميل الملف');
    students = await response.json();
    indicator.textContent = `✅ تم تحميل ${students.length} طالب بنجاح`;
    setTimeout(() => { indicator.textContent = ''; }, 2500);
  } catch (err) {
    indicator.innerHTML = `<span style="color:var(--red)">❌ خطأ في تحميل البيانات: ${escHtml(err.message)}</span>`;
  }
}

/* ─── Helpers ───────────────────────────────────────────── */


/** Compute average of valid grades (skip -4 absent) */
function computeStats(courses) {
  const valid = courses.filter(c => c.grade !== -4);
  if (valid.length === 0) return { avg: 0, total: 0, count: 0, highest: 0, absentCount: courses.length };

  const total   = valid.reduce((s, c) => s + c.grade, 0);
  const avg     = total / valid.length;
  const highest = Math.max(...valid.map(c => c.grade));
  const absentCount = courses.length - valid.length;

  return { avg: avg.toFixed(1), total: total.toFixed(1), count: valid.length, highest, absentCount };
}

/** Pick a colour class for the average */
function avgClass(avg) {
  const n = parseFloat(avg);
  if (n >= 25) return 'gpa-high';
  if (n >= 20) return 'gpa-mid';
  if (n >= 15) return 'gpa-ok';
  if (n >= 10) return 'gpa-low';
  return 'gpa-fail';
}

/** Escape HTML to prevent XSS */
function escHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

/* ─── Render Functions ──────────────────────────────────── */

function renderSkeleton() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <br/>
      <div class="skeleton-line full"></div>
      <div class="skeleton-line full"></div>
      <div class="skeleton-line full"></div>
      <div class="skeleton-line medium"></div>
    </div>`;
}

function renderNotFound(id) {
  return `
    <div class="not-found">
      <div class="icon">🔍</div>
      <h3>لم يتم العثور على الطالب</h3>
      <p>لا يوجد طالب بالرقم <strong style="direction:ltr;display:inline-block">${escHtml(id)}</strong> في النظام.</p>
    </div>`;
}

function renderStudent(student) {
  const stats = computeStats(student.courses);
  const ac    = avgClass(stats.avg);

  const rows = student.courses.map((c, i) => {
    return `
      <tr>
        <td>${i + 1}</td>
        <td><span class="course-name">${escHtml(c.course)}</span></td>
        <td>${c.grade}</td>
      </tr>`;
  }).join('');

  return `
    <div class="student-card">
      <div class="card-header">
        <div class="card-header-info">
          <h2>${escHtml(student.name)}</h2>
          <div class="meta">
            <div class="chip">الرقم&nbsp;<span>${escHtml(String(student.id))}</span></div>
            <div class="chip">📚&nbsp;<span>${student.courses.length} مقرر</span></div>
            ${stats.absentCount > 0 ? `<div class="chip" style="border-color:rgba(231,76,60,0.3)">🚫&nbsp;<span style="color:var(--red)">${stats.absentCount} محروم</span></div>` : ''}
          </div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-value ${ac}">${stats.avg}</div>
          <div class="stat-label">المتوسط</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:#a8a4ff">${stats.total}</div>
          <div class="stat-label">المجموع</div>
        </div>
        <div class="stat-item">
          <div class="stat-value gpa-high">${stats.highest}</div>
          <div class="stat-label">أعلى درجة</div>
        </div>
      </div>

      <div class="card-body">
        <div class="section-title">📋 درجات المقررات</div>
        <table class="courses-table" aria-label="درجات الطالب ${escHtml(student.name)}">
          <thead>
            <tr>
              <th>#</th>
              <th>المقرر</th>
              <th>الدرجة</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

/* ─── Search Logic ──────────────────────────────────────── */

const input      = document.getElementById('studentIdInput');
const btn        = document.getElementById('searchBtn');
const resultArea = document.getElementById('resultArea');
const validMsg   = document.getElementById('validationMsg');

function search() {
  const raw = input.value.trim();

  /* Validation */
  if (!raw) {
    validMsg.textContent = '⚠️ يرجى إدخال رقم الطالب أولاً';
    input.focus();
    return;
  }

  if (students.length === 0) {
    validMsg.textContent = '⚠️ لم يتم تحميل البيانات بعد، يرجى الانتظار';
    return;
  }

  validMsg.textContent = '';

  /* Show skeleton */
  btn.disabled = true;
  resultArea.innerHTML = renderSkeleton();

  /* Simulate async search (brief loading feel) */
  setTimeout(() => {
    const searchId = parseInt(raw, 10);
    const found = students.find(s => s.id === searchId);
    resultArea.innerHTML = found ? renderStudent(found) : renderNotFound(raw);
    btn.disabled = false;
  }, 250);
}

/* ─── Events ────────────────────────────────────────────── */
btn.addEventListener('click', search);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});

input.addEventListener('input', () => {
  if (validMsg.textContent) validMsg.textContent = '';
});

/* ─── Init ──────────────────────────────────────────────── */
loadStudents();
