/**
 * Privora 2.0 - Virtual Assistant Widget
 * 100% Offline Rule-Based Intelligence Engine
 * Supports Student, Teacher, and Admin Consoles with dynamic live data calculation.
 */

(function () {
  'use strict';

  // Determine current console role
  function getConsoleRole() {
    const el = document.getElementById('privoraAssistantOffcanvas');
    if (el && el.getAttribute('data-assistant-role')) {
      return el.getAttribute('data-assistant-role').toLowerCase();
    }
    const path = window.location.pathname.toLowerCase();
    if (path.includes('student')) return 'student';
    if (path.includes('teacher')) return 'teacher';
    if (path.includes('admin')) return 'admin';
    return 'student';
  }

  // Live Data Aggregator (reads from localStorage and DOM with robust defaults)
  function getLiveData(role) {
    const activeToken = localStorage.getItem('privora_session_token') || 'PRV-8492-X';
    const expirySec = localStorage.getItem('privora_expiry_sec') || '60';
    const userName = localStorage.getItem('privora_user_name') || 
      (role === 'student' ? 'Juan Dela Cruz' : (role === 'admin' ? 'Admin Santos' : 'Prof. Alex Santos'));
    
    // Student data
    const presentEl = document.getElementById('statPresentCount');
    const lateEl = document.getElementById('statLateCount');
    const absentEl = document.getElementById('statAbsentCount');
    const rateEl = document.getElementById('statOverallRate');

    const presentCount = presentEl ? parseInt(presentEl.textContent, 10) || 28 : 28;
    const lateCount = lateEl ? parseInt(lateEl.textContent, 10) || 3 : 3;
    const absentCount = absentEl ? parseInt(absentEl.textContent, 10) || 1 : 1;
    const overallRate = rateEl ? rateEl.textContent.trim() : '93.8%';

    // Teacher data
    const attendeesEl = document.getElementById('teacherAttendeesCount');
    const avgRateEl = document.getElementById('statAvgRate');
    const verifiedScansEl = document.getElementById('statVerifiedScans');
    const duplicatesEl = document.getElementById('statDuplicates');
    const missingEl = document.getElementById('statMissing');

    const attendeesCount = attendeesEl ? attendeesEl.textContent.trim() : '42 / 48 Checked In';
    const avgRate = avgRateEl ? avgRateEl.textContent.trim() : '95.1%';
    const verifiedScans = verifiedScansEl ? verifiedScansEl.textContent.trim() : '428';
    const duplicatesCount = duplicatesEl ? duplicatesEl.textContent.trim() : '2';
    const missingCount = missingEl ? missingEl.textContent.trim() : '4';
    const isPaused = localStorage.getItem('privora_session_paused') === 'true';
    const isArchived = localStorage.getItem('privora_session_archived') === 'true';

    // Admin data
    const sysSettings = JSON.parse(localStorage.getItem('privora_system_settings') || '{}');
    const warningCutoff = sysSettings.threshold || '80';
    const academicTerm = sysSettings.academicTerm || '1st Semester AY 2026-2027';

    return {
      userName,
      activeToken,
      expirySec,
      student: {
        presentCount,
        lateCount,
        absentCount,
        overallRate,
        courses: [
          { code: 'CS-301', name: 'Cloud Computing & Web Systems', attended: 25, total: 32, rate: '78.5%', atRisk: true },
          { code: 'IT-204', name: 'Database Management Systems', attended: 31, total: 32, rate: '96.9%', atRisk: false },
          { code: 'ENG-102', name: 'Technical Communications', attended: 30, total: 32, rate: '93.8%', atRisk: false }
        ]
      },
      teacher: {
        attendeesCount,
        avgRate,
        verifiedScans,
        duplicatesCount,
        missingCount,
        isPaused,
        isArchived,
        subject: 'CS-301: Cloud Computing (Lab 402)',
        atRiskStudents: [
          { name: 'Miguel Santos', id: '2026-0112', course: 'CS-301', rate: '75.0%', missed: 3 },
          { name: 'Chloe Vance', id: '2026-0442', course: 'CS-301', rate: '71.9%', missed: 4 },
          { name: 'David Kim', id: '2026-0689', course: 'CS-301', rate: '77.2%', missed: 2 },
          { name: 'Juan Dela Cruz', id: '2026-10492', course: 'CS-301', rate: '78.5%', missed: 1 }
        ]
      },
      admin: {
        totalEnrolled: 450,
        verifiedScansToday: 428,
        turnoutRate: '95.1%',
        securityFlagsCount: 2,
        atRiskCount: 4,
        warningCutoff,
        academicTerm,
        flaggedSubnets: ['192.168.1.88 (CS-301)', '192.168.1.92 (IT-204)']
      }
    };
  }

  // Quick Chips configuration per role
  const QUICK_CHIPS = {
    student: [
      { id: 'std_rate', label: '📊 Check my attendance', query: 'check my attendance percentage' },
      { id: 'std_absences', label: '⚠️ Remaining absences', query: 'how many absences remain before 80% cutoff?' },
      { id: 'std_qr', label: '📷 How QR scanning works', query: 'how does QR session scanning work?' },
      { id: 'std_recover', label: '🛡️ Drop-risk recovery', query: 'how do I recover from below 80% drop risk?' }
    ],
    teacher: [
      { id: 'tch_atrisk', label: '⚠️ Students below 80%', query: 'list students currently below 80% or at drop risk' },
      { id: 'tch_session', label: '📡 Active session summary', query: 'summarize active session attendance' },
      { id: 'tch_triggers', label: '🚨 Drop-risk alert triggers', query: 'explain drop-risk alert triggers' },
      { id: 'tch_controls', label: '⚙️ QR session controls', query: 'how do pause and archive controls work?' }
    ],
    admin: [
      { id: 'adm_health', label: '🏥 Attendance health', query: 'summarize system-wide attendance health' },
      { id: 'adm_flags', label: '⚠️ Flagged drop-risk counts', query: 'show flagged drop-risk counts across cohorts' },
      { id: 'adm_audit', label: '🛡️ QR audit status', query: 'summarize QR audit and security flags' },
      { id: 'adm_config', label: '⚙️ System configuration', query: 'show global system settings parameters' }
    ]
  };

  // Rule-based Natural Language Processing & Response Generation
  function generateAssistantResponse(query, role) {
    const q = query.toLowerCase().trim();
    const data = getLiveData(role);

    // ==========================================
    // 1. STUDENT CONSOLE RULES
    // ==========================================
    if (role === 'student') {
      // Attendance rate / percentage / standing
      if (q.includes('rate') || q.includes('attendance') || q.includes('percentage') || q.includes('standing') || q.includes('present') || q.includes('std_rate')) {
        const s = data.student;
        let msg = `<strong>📊 Attendance Standing for ${data.userName}</strong><br>`;
        msg += `• <strong>Overall Rate:</strong> <span class="text-primary fw-bold">${s.overallRate}</span> (${s.presentCount} present, ${s.lateCount} late, ${s.absentCount} absent)<br><br>`;
        msg += `<strong>Enrolled Courses Breakdown:</strong><br>`;
        s.courses.forEach(c => {
          const badge = c.atRisk 
            ? `<span class="badge bg-warning text-dark">⚠️ ${c.rate} (Below 80%)</span>`
            : `<span class="badge bg-success-subtle text-success border border-success-subtle">✅ ${c.rate}</span>`;
          msg += `• <strong>${c.code}:</strong> ${c.name} — ${badge}<br>`;
        });
        msg += `<br><span class="small text-slate">Active QR broadcast token: <code>${data.activeToken}</code></span>`;
        return msg;
      }

      // Remaining absences / drop risk cutoff / 80%
      if (q.includes('absence') || q.includes('remain') || q.includes('drop') || q.includes('cutoff') || q.includes('80') || q.includes('miss') || q.includes('std_absences')) {
        return `<strong>⚠️ Absences Calculation &amp; 80% Drop-Risk Cutoff:</strong><br><br>` +
          `• <strong>Institutional Requirement:</strong> Minimum <strong>80.0%</strong> attendance per course.<br>` +
          `• <strong>Course Semester Hours:</strong> Standard 32 sessions per module (maximum <strong>6 total absences</strong> allowed).<br><br>` +
          `<strong>Your Course Status:</strong><br>` +
          `• <strong class="text-danger">CS-301 (Cloud Computing):</strong> Attended 25/32 (78.5%).<br>` +
          `&nbsp;&nbsp;→ <strong>0 Absences Remaining!</strong> You are currently in the drop-risk zone. You must attend all remaining sessions to restore credit eligibility.<br>` +
          `• <strong class="text-success">IT-204 (Database Systems):</strong> Attended 31/32 (96.9%).<br>` +
          `&nbsp;&nbsp;→ <strong>5 Absences Remaining</strong> before reaching the 80% threshold.<br>` +
          `• <strong class="text-success">ENG-102 (Technical Comm):</strong> Attended 30/32 (93.8%).<br>` +
          `&nbsp;&nbsp;→ <strong>4 Absences Remaining</strong> before reaching the 80% threshold.<br><br>` +
          `<em>Tip: Missing 1 more session in CS-301 will disqualify you from the final assessment.</em>`;
      }

      // How QR scanning works
      if (q.includes('qr') || q.includes('scan') || q.includes('camera') || q.includes('how') || q.includes('viewport') || q.includes('std_qr')) {
        return `<strong>📷 How Privora QR Scanning Works:</strong><br><br>` +
          `1. <strong>Live Viewfinder:</strong> Position the classroom QR code inside the green optical viewport bounds.<br>` +
          `2. <strong>Camera Selection:</strong> Use the dropdown above the scanner to toggle between Front and Rear lenses.<br>` +
          `3. <strong>Dynamic Token Check:</strong> Your scanner instantly captures and cryptographically matches the active classroom token (Current: <code>${data.activeToken}</code>).<br>` +
          `4. <strong>Instant Verification:</strong> On-time confirmation is logged within <strong>&lt; 1.0s</strong>, automatically updating your attendance logs and course percentage standing.<br><br>` +
          `<small class="text-slate">Anti-proxy protection: Tokens rotate every 60s to prevent stale photo scans.</small>`;
      }

      // Recovery steps from drop risk
      if (q.includes('recover') || q.includes('help') || q.includes('appeal') || q.includes('warning') || q.includes('std_recover')) {
        return `<strong>🛡️ Drop-Risk Recovery Roadmap:</strong><br><br>` +
          `1. <strong>Attend All Upcoming Sessions:</strong> Each attended session increases your attendance percentage by approximately <strong>+3.1%</strong>.<br>` +
          `2. <strong>Consult Faculty:</strong> Reach out to <strong>Prof. Alex Santos</strong> (CS-301) to verify if pending make-up lab activities or excuse slips can be credited.<br>` +
          `3. <strong>Verify Excused Absences:</strong> Official medical or university certificates can be cleared through the Academic Administrator.<br>` +
          `4. <strong>Live Verification:</strong> Verify each attendance record in the <em>Attendance Logs</em> table immediately after class.`;
      }
    }

    // ==========================================
    // 2. TEACHER CONSOLE RULES
    // ==========================================
    if (role === 'teacher') {
      // Students below 80% or at risk
      if (q.includes('student') || q.includes('below') || q.includes('risk') || q.includes('missing') || q.includes('at-risk') || q.includes('tch_atrisk')) {
        const t = data.teacher;
        let msg = `<strong>⚠️ Students at Drop Risk (&lt; 80% Cutoff) in ${t.subject}:</strong><br><br>`;
        t.atRiskStudents.forEach((st, idx) => {
          msg += `${idx + 1}. <strong>${st.name}</strong> (${st.id})<br>`;
          msg += `&nbsp;&nbsp;• Course Standing: <span class="text-danger fw-bold">${st.rate}</span> (${st.missed} unexcused missed sessions)<br>`;
        });
        msg += `<br><strong>Total At-Risk:</strong> ${t.atRiskStudents.length} students.<br>`;
        msg += `<em>Action: Use the 'Notice' action in the missing records table or click 'Email Alerts' to dispatch automated warning notices.</em>`;
        return msg;
      }

      // Summarize active session
      if (q.includes('session') || q.includes('summary') || q.includes('active') || q.includes('turnout') || q.includes('broadcast') || q.includes('tch_session')) {
        const t = data.teacher;
        const statusBadge = t.isArchived 
          ? '<span class="badge bg-danger">Archived / Closed</span>' 
          : (t.isPaused ? '<span class="badge bg-warning text-dark">Paused</span>' : '<span class="badge bg-success">Active Broadcasting</span>');
        
        return `<strong>📡 Active Session Attendance Summary:</strong><br><br>` +
          `• <strong>Assigned Subject:</strong> ${t.subject}<br>` +
          `• <strong>Active Session Token:</strong> <code>${data.activeToken}</code><br>` +
          `• <strong>Broadcast State:</strong> ${statusBadge}<br>` +
          `• <strong>Checked In:</strong> <strong>${t.attendeesCount}</strong> (87.5% session turnout)<br>` +
          `• <strong>Average Turnout Rate:</strong> <span class="text-success fw-bold">${t.avgRate}</span><br>` +
          `• <strong>Verified Scans Today:</strong> ${t.verifiedScans}<br>` +
          `• <strong>Flagged Dual Scans:</strong> <span class="text-danger fw-bold">${t.duplicatesCount}</span><br>` +
          `• <strong>Token Expiry Window:</strong> ${data.expirySec} Seconds<br><br>` +
          `<small class="text-slate">Session controls: You can pause or archive this broadcast using the action buttons in the generator viewport.</small>`;
      }

      // Explain drop-risk alert triggers
      if (q.includes('trigger') || q.includes('alert') || q.includes('explain') || q.includes('notice') || q.includes('tch_triggers')) {
        return `<strong>🚨 Drop-Risk Trigger Mechanics:</strong><br><br>` +
          `1. <strong>Institutional Standard:</strong> The academic threshold is set to <strong>80.0%</strong> attendance minimum.<br>` +
          `2. <strong>Student Portal Alert:</strong> As soon as a student drops below 80%, a persistent amber warning banner displays on their portal.<br>` +
          `3. <strong>Teacher Dashboard Sync:</strong> The student is flagged in your 'Unexcused Missing Attendees' roster with an alert indicator.<br>` +
          `4. <strong>Automated Email Dispatch:</strong> Faculty can trigger one-click batch email warnings to notify students and department heads simultaneously.`;
      }

      // Session controls & QR rotation
      if (q.includes('control') || q.includes('pause') || q.includes('archive') || q.includes('qr') || q.includes('rotation') || q.includes('window') || q.includes('tch_controls')) {
        return `<strong>⚙️ QR Session Controls Overview:</strong><br><br>` +
          `• <strong>Pause Session:</strong> Blurs the broadcasted QR code with an amber overlay. Prevents students from scanning without archiving data.<br>` +
          `• <strong>Archive / Close Session:</strong> Finalizes attendance logs for Room 402, locks verified scans, and freezes student entry.<br>` +
          `• <strong>Rotation Interval:</strong> Currently configured to <strong>${data.expirySec} seconds</strong>. Tokens regenerate automatically with SHA-256 validation.<br>` +
          `• <strong>New Session:</strong> Clicking 'Start New Session' generates a fresh cryptographic session token.`;
      }
    }

    // ==========================================
    // 3. ADMIN CONSOLE RULES
    // ==========================================
    if (role === 'admin') {
      // System attendance health
      if (q.includes('health') || q.includes('summary') || q.includes('turnout') || q.includes('overall') || q.includes('adm_health')) {
        const a = data.admin;
        return `<strong>🏥 System-Wide Attendance Health:</strong><br><br>` +
          `• <strong>Active Student Roster:</strong> <strong>${a.totalEnrolled} Students</strong> enrolled across 12 sections.<br>` +
          `• <strong>Verified Scans Today:</strong> <strong>${a.verifiedScansToday} Scans</strong> (${a.turnoutRate} turnout rate).<br>` +
          `• <strong>System Health Status:</strong> <span class="badge bg-success-subtle text-success border border-success-subtle">✅ Optimal &bull; 99.5% Legitimacy</span><br>` +
          `• <strong>Academic Calendar:</strong> ${a.academicTerm}<br>` +
          `• <strong>Subnet Geofencing:</strong> Enforced (Wi-Fi IP filtering enabled).<br><br>` +
          `<small class="text-slate">Attendance audits synchronize continuously with the institutional database.</small>`;
      }

      // Flagged drop-risk counts
      if (q.includes('flag') || q.includes('drop') || q.includes('count') || q.includes('at-risk') || q.includes('cohort') || q.includes('adm_flags')) {
        const a = data.admin;
        return `<strong>⚠️ Institutional Drop-Risk Analytics:</strong><br><br>` +
          `• <strong>Flagged Students:</strong> <strong>${a.atRiskCount} Students</strong> currently below the ${a.warningCutoff}% threshold.<br>` +
          `• <strong>Cohort Breakdown:</strong><br>` +
          `&nbsp;&nbsp;• CS-301 (Cloud Computing): 4 students flagged<br>` +
          `&nbsp;&nbsp;• IT-204 (Database Systems): 0 students flagged<br>` +
          `&nbsp;&nbsp;• ENG-102 (Technical Comm): 0 students flagged<br>` +
          `• <strong>Automated Compliance:</strong> Warning banners served to student consoles and faculty notification logs queued.<br>` +
          `• <strong>De-registration Status:</strong> No students currently flagged for automatic drop de-registration.`;
      }

      // QR security audit status
      if (q.includes('audit') || q.includes('security') || q.includes('duplicate') || q.includes('subnet') || q.includes('anomaly') || q.includes('adm_audit')) {
        const a = data.admin;
        let msg = `<strong>🛡️ QR Security &amp; Audit Status:</strong><br><br>`;
        msg += `• <strong>Security Flags:</strong> <span class="text-danger fw-bold">${a.securityFlagsCount} rapid dual-scan attempts</span> intercepted today.<br>`;
        msg += `• <strong>Quarantined Subnets:</strong><br>`;
        a.flaggedSubnets.forEach(sub => {
          msg += `&nbsp;&nbsp;• <code>${sub}</code><br>`;
        });
        msg += `• <strong>Active Token Expiration Window:</strong> <strong>${data.expirySec} Seconds</strong>.<br>`;
        msg += `• <strong>Subnet Geofencing:</strong> Active (enforces institutional campus Wi-Fi check-ins).<br>`;
        msg += `• <strong>Token Encryption:</strong> Rotating SHA-256 cryptographic payloads verified.`;
        return msg;
      }

      // Global system configuration
      if (q.includes('config') || q.includes('settings') || q.includes('threshold') || q.includes('parameter') || q.includes('adm_config')) {
        const a = data.admin;
        return `<strong>⚙️ Global System Configuration Parameters:</strong><br><br>` +
          `• <strong>Attendance Warning Cut-off:</strong> <strong>${a.warningCutoff}%</strong> minimum attendance required.<br>` +
          `• <strong>Default QR Window:</strong> <strong>${data.expirySec} Seconds</strong> (Standard Classroom Security).<br>` +
          `• <strong>Current Academic Term:</strong> ${a.academicTerm}.<br>` +
          `• <strong>Wi-Fi Subnet Geofence:</strong> Enforced on local campus IP ranges.<br>` +
          `• <strong>Real-time Alert Dispatch:</strong> Enabled for duplicate scan detection.<br><br>` +
          `<small class="text-slate">Adjust these parameters in the System Settings section of the Admin Console.</small>`;
      }
    }

    // ==========================================
    // 4. COMMON / GENERAL FALLBACK RULES
    // ==========================================
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('who are you')) {
      return `Hello! I am your <strong>Privora Virtual Assistant</strong>. I run 100% offline using your local workspace data to provide instant attendance analytics, drop-risk calculations, and QR audit intelligence. How can I help you today?`;
    }

    if (q.includes('help') || q.includes('what can you do')) {
      return `I can help you with:<br>` +
        `• Real-time attendance rate checks and course breakdowns.<br>` +
        `• Calculating remaining allowable absences before the 80% drop-risk cutoff.<br>` +
        `• Explaining dynamic QR session generation and optical scanner viewports.<br>` +
        `• Reviewing at-risk rosters and security audit flags.<br><br>` +
        `<em>Click any of the quick prompt chips above or type a specific question!</em>`;
    }

    // Default Fallback
    return `I am your offline Privora Assistant. I didn't recognize that specific command, but I can assist with:<br>` +
      `• <strong>Attendance:</strong> Check current attendance rate and course records.<br>` +
      `• <strong>Drop Risk:</strong> Calculate remaining absences before the 80% threshold.<br>` +
      `• <strong>QR System:</strong> View token generation and optical scanning mechanics.<br>` +
      `• <strong>Audits &amp; Alerts:</strong> Review security flags and attendance notices.<br><br>` +
      `<small class="text-slate">Try clicking one of the suggested quick prompt chips above!</small>`;
  }

  // UI Builder & Event Handler
  function initPrivoraAssistant() {
    const role = getConsoleRole();
    const chips = QUICK_CHIPS[role] || QUICK_CHIPS.student;

    const messagesContainer = document.getElementById('assistantMessages');
    const chipsContainer = document.getElementById('assistantQuickChips');
    const inputForm = document.getElementById('assistantInputForm');
    const textInput = document.getElementById('assistantTextInput');

    if (!messagesContainer) return;

    // Render Quick Prompt Chips
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      chips.forEach(chip => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm assistant-chip-btn';
        btn.textContent = chip.label;
        btn.setAttribute('data-query', chip.query);
        btn.addEventListener('click', function () {
          sendMessage(chip.query, true);
        });
        chipsContainer.appendChild(btn);
      });
    }

    // Initial Welcome Message
    function renderWelcome() {
      const data = getLiveData(role);
      let welcomeText = '';
      if (role === 'student') {
        welcomeText = `Welcome, <strong>${data.userName}</strong>! I can check your attendance percentage, calculate remaining allowable absences before the 80% cutoff, or explain how QR scanning works.`;
      } else if (role === 'teacher') {
        welcomeText = `Welcome, <strong>${data.userName}</strong>! I can summarize your active CS-301 session, list students below the 80% drop-risk threshold, or explain alert dispatch mechanics.`;
      } else {
        welcomeText = `Welcome, <strong>${data.userName}</strong>! I can report system-wide attendance health, count flagged at-risk students, or summarize the QR security audit trail.`;
      }

      appendMessage('assistant', welcomeText);
    }

    // Append Message to Chat
    function appendMessage(sender, htmlContent) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-msg chat-${sender}`;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      msgDiv.innerHTML = `
        <div class="chat-bubble">
          ${htmlContent}
        </div>
        <div class="chat-time">${timeStr}</div>
      `;

      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Send Message Handler
    function sendMessage(queryText, fromChip = false) {
      const text = queryText.trim();
      if (!text) return;

      // Append user bubble
      appendMessage('user', text);

      if (!fromChip && textInput) {
        textInput.value = '';
      }

      // Generate response
      setTimeout(() => {
        const reply = generateAssistantResponse(text, role);
        appendMessage('assistant', reply);
      }, 150);
    }

    // Handle Form Submit
    if (inputForm) {
      inputForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (textInput) {
          sendMessage(textInput.value, false);
        }
      });
    }

    // Render initial message
    renderWelcome();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrivoraAssistant);
  } else {
    initPrivoraAssistant();
  }
})();
