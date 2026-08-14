let activeUser = null;

document.addEventListener('DOMContentLoaded', () => {
  checkUserAuth();
});

async function checkUserAuth() {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      showLoginScreen();
    } else {
      const data = await res.json();
      if (data.success) {
        setupViews(data.user);
      } else {
        showLoginScreen();
      }
    }
  } catch (e) {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('appLayout').classList.add('hidden');
}

function setupViews(user) {
  activeUser = user;
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('appLayout').classList.remove('hidden');
  document.getElementById('userBadge').textContent = `Logged in: ${user.username} (${user.role})`;

  // Show specific role options
  document.getElementById('adminMenu').classList.add('hidden');
  document.getElementById('teacherMenu').classList.add('hidden');
  document.getElementById('studentMenu').classList.add('hidden');

  if (user.role === 'admin') {
    document.getElementById('adminMenu').classList.remove('hidden');
    showView('adminDashboard');
  } else if (user.role === 'teacher') {
    document.getElementById('teacherMenu').classList.remove('hidden');
    showView('teacherDashboard');
  } else if (user.role === 'student') {
    document.getElementById('studentMenu').classList.remove('hidden');
    showView('studentDashboard');
  }
}

function showView(viewId) {
  document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));
  document.getElementById(viewId + 'View').classList.remove('hidden');

  document.querySelectorAll('.menu-link').forEach(el => el.classList.remove('active'));
  const activeLink = document.getElementById('link-' + viewId);
  if (activeLink) activeLink.classList.add('active');

  if (viewId === 'adminDashboard') loadAdminStats();
  if (viewId === 'students') loadStudentList();
  if (viewId === 'teachers') loadTeacherList();
  if (viewId === 'attendance') initAttendanceDate();
  if (viewId === 'marks') loadMarksRegister();
  if (viewId === 'studentDashboard') loadStudentDashboard();
  if (viewId === 'studentReport') loadStudentReport();
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value;
  const password = document.getElementById('loginPass').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setupViews(data.user);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Server Connection failed');
  }
}

async function handleLogout() {
  await fetch('/api/logout');
  activeUser = null;
  showLoginScreen();
}

// Modal dialogs
function openPopup(title, body, footer) {
  document.getElementById('popupTitle').textContent = title;
  document.getElementById('popupBody').innerHTML = body;
  document.getElementById('popupFooter').innerHTML = footer;
  document.getElementById('popupBox').classList.remove('hidden');
}
function closePopup() {
  document.getElementById('popupBox').classList.add('hidden');
}

// Load admin stats
async function loadAdminStats() {
  const res = await fetch('/api/stats');
  const data = await res.json();
  if (data.success) {
    document.getElementById('valStudents').textContent = data.students;
    document.getElementById('valTeachers').textContent = data.teachers;
    document.getElementById('valClasses').textContent = data.classes;
    document.getElementById('valUsers').textContent = data.users;
  }
}

// Student list loader
async function loadStudentList() {
  const res = await fetch('/api/students');
  const data = await res.json();
  const tbody = document.getElementById('studentTableBody');
  tbody.innerHTML = '';

  if (!data.data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No students in database.</td></tr>';
    return;
  }

  data.data.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.roll_number}</td>
        <td><strong>${s.full_name}</strong></td>
        <td>@${s.username}</td>
        <td>${s.class_name}</td>
        <td>${s.address || '-'}</td>
        <td>
          <button class="btn btn-delete" onclick="deleteStudent(${s.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function openAddStudentModal() {
  const body = `
    <div class="form-field">
      <label>Full Name:</label>
      <input type="text" id="stuFullName" required>
    </div>
    <div class="form-field">
      <label>Username:</label>
      <input type="text" id="stuUser" required>
    </div>
    <div class="form-field">
      <label>Email ID:</label>
      <input type="email" id="stuEmail" required>
    </div>
    <div class="form-field">
      <label>Class Name:</label>
      <input type="text" id="stuClass" value="Class 10" required>
    </div>
    <div class="form-field">
      <label>Roll Number:</label>
      <input type="text" id="stuRoll" required>
    </div>
    <div class="form-field">
      <label>Address:</label>
      <input type="text" id="stuAddr">
    </div>
  `;
  const footer = `
    <button class="btn" onclick="closePopup()" style="margin-right:5px;">Cancel</button>
    <button class="btn" onclick="submitAddStudent()">Save student</button>
  `;
  openPopup('Add Student', body, footer);
}

async function submitAddStudent() {
  const body = {
    full_name: document.getElementById('stuFullName').value,
    username: document.getElementById('stuUser').value,
    email: document.getElementById('stuEmail').value,
    class_name: document.getElementById('stuClass').value,
    roll_number: document.getElementById('stuRoll').value,
    address: document.getElementById('stuAddr').value
  };

  if (!body.full_name || !body.username || !body.email || !body.roll_number) {
    alert('Please fill out all required fields');
    return;
  }

  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.success) {
    alert('Student created. Password defaults to Student@123');
    closePopup();
    loadStudentList();
  } else {
    alert(data.message);
  }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student record?')) return;
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    loadStudentList();
  }
}

// Teacher list loader
async function loadTeacherList() {
  const res = await fetch('/api/teachers');
  const data = await res.json();
  const tbody = document.getElementById('teacherTableBody');
  tbody.innerHTML = '';

  if (!data.data.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No teachers in database.</td></tr>';
    return;
  }

  data.data.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><strong>@${t.username}</strong></td>
        <td>${t.email}</td>
        <td>${t.role}</td>
        <td>
          <button class="btn btn-delete" onclick="deleteTeacher(${t.id})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function openAddTeacherModal() {
  const body = `
    <div class="form-field">
      <label>Username:</label>
      <input type="text" id="teaUser" required>
    </div>
    <div class="form-field">
      <label>Email ID:</label>
      <input type="email" id="teaEmail" required>
    </div>
  `;
  const footer = `
    <button class="btn" onclick="closePopup()" style="margin-right:5px;">Cancel</button>
    <button class="btn" onclick="submitAddTeacher()">Save teacher</button>
  `;
  openPopup('Add Teacher', body, footer);
}

async function submitAddTeacher() {
  const body = {
    username: document.getElementById('teaUser').value,
    email: document.getElementById('teaEmail').value
  };

  if (!body.username || !body.email) {
    alert('Please fill out all fields');
    return;
  }

  const res = await fetch('/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.success) {
    alert('Teacher created. Password defaults to Teacher@123');
    closePopup();
    loadTeacherList();
  } else {
    alert(data.message);
  }
}

async function deleteTeacher(id) {
  if (!confirm('Delete this teacher?')) return;
  const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) {
    loadTeacherList();
  }
}

// Attendance mark helpers
function initAttendanceDate() {
  document.getElementById('attDate').value = new Date().toISOString().split('T')[0];
}

async function loadAttendanceList() {
  const className = document.getElementById('attClass').value;
  const date = document.getElementById('attDate').value;
  const tbody = document.getElementById('attendanceTableBody');
  const btn = document.getElementById('saveAttBtn');

  if (!className || !date) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Select class name and target date first.</td></tr>';
    btn.classList.add('hidden');
    return;
  }

  const res = await fetch(`/api/attendance/students/${className}?date=${date}`);
  const data = await res.json();
  tbody.innerHTML = '';

  if (!data.data.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No students in this class.</td></tr>';
    btn.classList.add('hidden');
    return;
  }

  data.data.forEach(s => {
    tbody.innerHTML += `
      <tr data-student-id="${s.student_id}">
        <td>${s.roll_number}</td>
        <td><strong>${s.full_name}</strong></td>
        <td>
          <input type="radio" name="att_${s.student_id}" value="Present" ${s.today_status === 'Present' || !s.today_status ? 'checked' : ''}> Present
          <input type="radio" name="att_${s.student_id}" value="Absent" ${s.today_status === 'Absent' ? 'checked' : ''}> Absent
        </td>
      </tr>
    `;
  });
  btn.classList.remove('hidden');
}

async function saveAttendanceRegister() {
  const date = document.getElementById('attDate').value;
  const list = [];

  document.querySelectorAll('#attendanceTableBody tr').forEach(row => {
    const studentId = row.getAttribute('data-student-id');
    if (studentId) {
      const status = row.querySelector(`input[name="att_${studentId}"]:checked`).value;
      list.push({ student_id: parseInt(studentId), status });
    }
  });

  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, attendance: list })
  });
  const data = await res.json();
  if (data.success) {
    alert('Attendance marked successfully');
  }
}

// Marks listing
async function loadMarksRegister() {
  const res = await fetch('/api/marks');
  const data = await res.json();
  const tbody = document.getElementById('marksTableBody');
  tbody.innerHTML = '';

  if (!data.data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No marks loaded yet.</td></tr>';
    return;
  }

  data.data.forEach(m => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${m.full_name}</strong></td>
        <td>${m.class_name}</td>
        <td>${m.subject_name}</td>
        <td>${m.exam_type}</td>
        <td><strong>${m.marks_obtained}</strong></td>
      </tr>
    `;
  });
}

async function openAddMarksModal() {
  const studentsData = await fetch('/api/students');
  const st = await studentsData.json();
  const stOptions = st.data.map(s => `<option value="${s.id}">${s.full_name} (${s.class_name})</option>`).join('');

  const body = `
    <div class="form-field">
      <label>Select Student:</label>
      <select id="mStudentId">${stOptions}</select>
    </div>
    <div class="form-field">
      <label>Subject Name:</label>
      <input type="text" id="mSubject" required>
    </div>
    <div class="form-field">
      <label>Exam Type:</label>
      <select id="mExamType">
        <option>Mid Term</option>
        <option>Final</option>
      </select>
    </div>
    <div class="form-field">
      <label>Marks Obtained (out of 100):</label>
      <input type="number" id="mObtained" min="0" max="100" required>
    </div>
  `;
  const footer = `
    <button class="btn" onclick="closePopup()" style="margin-right:5px;">Cancel</button>
    <button class="btn" onclick="submitMarks()">Submit marks</button>
  `;
  openPopup('Upload Marks', body, footer);
}

async function submitMarks() {
  const body = {
    student_id: parseInt(document.getElementById('mStudentId').value),
    subject_name: document.getElementById('mSubject').value.trim(),
    exam_type: document.getElementById('mExamType').value,
    marks_obtained: parseInt(document.getElementById('mObtained').value)
  };

  if (!body.student_id || !body.subject_name || body.marks_obtained === undefined) {
    alert('Please fill out all fields');
    return;
  }

  const res = await fetch('/api/marks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.success) {
    closePopup();
    loadMarksRegister();
  }
}

// Student portal specifics
function loadStudentDashboard() {}

async function loadStudentReport() {
  const res = await fetch(`/api/marks/result/${activeUser.extra_id}`);
  const data = await res.json();
  const tbody = document.getElementById('studentReportBody');
  tbody.innerHTML = '';

  if (!data.data.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No results uploaded yet.</td></tr>';
    return;
  }

  data.data.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${r.subject_name}</strong></td>
        <td>${r.exam_type}</td>
        <td><strong>${r.marks_obtained}</strong></td>
      </tr>
    `;
  });
}

async function handleChangePassword(e) {
  e.preventDefault();
  const current_password = document.getElementById('curPwd').value;
  const new_password = document.getElementById('newPwd').value;

  const res = await fetch('/api/profile/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password, new_password })
  });
  const data = await res.json();
  if (data.success) {
    alert('Password updated successfully');
    document.getElementById('curPwd').value = '';
    document.getElementById('newPwd').value = '';
  } else {
    alert(data.message);
  }
}
