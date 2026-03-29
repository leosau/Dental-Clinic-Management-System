const STORAGE_KEY = "dcms_state_v2";

const DEFAULT_DASHBOARD_RANGES = {
  today: {
    appointments: [
      { time: "08:30", patient: "Maria Santos", procedure: "Orthodontic follow-up", status: "done" },
      { time: "09:15", patient: "John Rivera", procedure: "Teeth cleaning", status: "done" },
      { time: "10:00", patient: "Eli Cruz", procedure: "Root canal consultation", status: "next" },
      { time: "10:45", patient: "Pamela Uy", procedure: "Whitening treatment", status: "waiting" },
      { time: "11:30", patient: "Noah Delos", procedure: "Bridge fitting", status: "waiting" }
    ],
    queue: [
      { patient: "Cindy Tan", concern: "Wisdom tooth pain", arrived: false },
      { patient: "Rafael Ong", concern: "Pediatric checkup", arrived: true },
      { patient: "Leah Ramos", concern: "Annual oral exam", arrived: false }
    ],
    quickCard: "4 surgeries, 9 cleanings, 13 consultations",
    completedProcedures: 31,
    pendingInsurance: "$5,420"
  },
  week: {
    appointments: [
      { time: "Mon", patient: "62 appointments", procedure: "Highest on Wednesday", status: "done" },
      { time: "Tue", patient: "58 appointments", procedure: "Cleanings trending up", status: "done" },
      { time: "Wed", patient: "73 appointments", procedure: "Implants + surgeries", status: "next" },
      { time: "Thu", patient: "61 appointments", procedure: "Steady recall visits", status: "waiting" },
      { time: "Fri", patient: "67 appointments", procedure: "Insurance review peak", status: "waiting" }
    ],
    queue: [
      { patient: "Average wait", concern: "17 minutes", arrived: true },
      { patient: "No-show rate", concern: "4.2%", arrived: true },
      { patient: "Urgent walk-ins", concern: "11 total", arrived: false }
    ],
    quickCard: "24 surgeries, 59 cleanings, 186 consultations",
    completedProcedures: 174,
    pendingInsurance: "$23,910"
  },
  month: {
    appointments: [
      { time: "Week 1", patient: "245 patients", procedure: "Post-holiday surge", status: "done" },
      { time: "Week 2", patient: "231 patients", procedure: "Stable restorative work", status: "done" },
      { time: "Week 3", patient: "262 patients", procedure: "Whitening campaign lift", status: "next" },
      { time: "Week 4", patient: "257 patients", procedure: "Preventive care focus", status: "waiting" },
      { time: "Week 5", patient: "198 patients", procedure: "Partial week total", status: "waiting" }
    ],
    queue: [
      { patient: "Total revenue", concern: "$211,300", arrived: true },
      { patient: "Treatments completed", concern: "1,138", arrived: true },
      { patient: "New patients", concern: "147", arrived: false }
    ],
    quickCard: "96 surgeries, 241 cleanings, 701 consultations",
    completedProcedures: 1138,
    pendingInsurance: "$94,800"
  }
};

const DEFAULT_STATE = {
  currentView: "dashboard",
  currentRange: "today",
  dashboardRanges: DEFAULT_DASHBOARD_RANGES,
  appointmentsManager: [
    { id: 1, patient: "Nina Perez", time: "1:00 PM", procedure: "Tooth Extraction", status: "pending" },
    { id: 2, patient: "Miguel Lao", time: "1:30 PM", procedure: "Dental Filling", status: "in-progress" },
    { id: 3, patient: "Tina Chu", time: "2:00 PM", procedure: "Teeth Cleaning", status: "completed" }
  ],
  patients: [
    { id: 1, name: "Carlo Dizon", contact: "09171234567", email: "carlo.dizon@email.com", birthdate: "1996-05-14", checkedIn: false },
    { id: 2, name: "Aira Gomez", contact: "09179887766", email: "aira.gomez@email.com", birthdate: "1992-10-02", checkedIn: true },
    { id: 3, name: "Ivy Co", contact: "09175553311", email: "ivy.co@email.com", birthdate: "2000-01-27", checkedIn: false }
  ],
  plans: [
    { id: 1, name: "J. Tan - Ortho Plan", details: "18-month braces plan", approved: false },
    { id: 2, name: "M. Cruz - Implant Plan", details: "2-stage implant timeline", approved: true },
    { id: 3, name: "L. Ong - Whitening Plan", details: "3-session treatment", approved: false }
  ],
  invoices: [
    { id: 1, code: "INV-1024", patient: "Maria Santos", amount: "$240", paid: false, reminded: false },
    { id: 2, code: "INV-1025", patient: "John Rivera", amount: "$180", paid: true, reminded: false },
    { id: 3, code: "INV-1026", patient: "Leah Ramos", amount: "$320", paid: false, reminded: false }
  ],
  inventory: [
    { id: 1, item: "Anesthetic Cartridges", stock: 8, low: true },
    { id: 2, item: "Latex Gloves (Box)", stock: 32, low: false },
    { id: 3, item: "Impression Material", stock: 5, low: true }
  ],
  team: [
    { id: 1, name: "Dr. Angela Lim", role: "Orthodontist", onDuty: true, shiftDate: "2026-03-29", shiftTime: "08:00", lastClockIn: "", lastClockOut: "" },
    { id: 2, name: "Mark Salonga", role: "Dental Assistant", onDuty: false, shiftDate: "2026-03-29", shiftTime: "09:00", lastClockIn: "", lastClockOut: "" },
    { id: 3, name: "Eunice Yap", role: "Front Desk", onDuty: true, shiftDate: "2026-03-29", shiftTime: "08:30", lastClockIn: "", lastClockOut: "" }
  ]
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withDefaults(saved) {
  const base = deepClone(DEFAULT_STATE);
  if (!saved || typeof saved !== "object") return base;

  return {
    ...base,
    ...saved,
    dashboardRanges: {
      ...base.dashboardRanges,
      ...(saved.dashboardRanges || {})
    }
  };
}

function calculateAge(birthdate) {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age < 0 ? "" : String(age);
}

function normalizePatients(patients) {
  return patients.map((patient) => {
    if (patient.contact && patient.email && patient.birthdate) return patient;
    return {
      id: patient.id,
      name: patient.name || "Unnamed Patient",
      contact: patient.contact || "N/A",
      email: patient.email || "N/A",
      birthdate: patient.birthdate || "",
      checkedIn: Boolean(patient.checkedIn)
    };
  });
}

function normalizeTeam(team) {
  return team.map((member) => ({
    id: member.id,
    name: member.name || "Unnamed Staff",
    role: member.role || "Clinic Staff",
    onDuty: Boolean(member.onDuty),
    shiftDate: member.shiftDate || "",
    shiftTime: member.shiftTime || "",
    lastClockIn: member.lastClockIn || "",
    lastClockOut: member.lastClockOut || ""
  }));
}

function normalizeDashboardRanges(ranges) {
  const base = deepClone(DEFAULT_DASHBOARD_RANGES);
  if (!ranges || typeof ranges !== "object") return base;
  return {
    ...base,
    ...ranges
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(DEFAULT_STATE);
    return withDefaults(JSON.parse(raw));
  } catch {
    return deepClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

const state = loadState();
state.patients = normalizePatients(state.patients);
state.team = normalizeTeam(state.team);
state.dashboardRanges = normalizeDashboardRanges(state.dashboardRanges);

const menuItems = Array.from(document.querySelectorAll(".menu-item"));
const chips = Array.from(document.querySelectorAll(".chip"));
const viewSections = Array.from(document.querySelectorAll(".view-section"));

const pageTitle = document.getElementById("pageTitle");
const todayLabel = document.getElementById("todayLabel");
const chipRow = document.getElementById("chipRow");
const checkedInCount = document.getElementById("checkedInCount");
const completedProcedures = document.getElementById("completedProcedures");
const pendingInsurance = document.getElementById("pendingInsurance");
const bookedCount = document.getElementById("bookedCount");
const bookedBreakdown = document.getElementById("bookedBreakdown");

const appointmentsList = document.getElementById("appointmentsList");
const queueList = document.getElementById("queueList");
const billingSnapshot = document.getElementById("billingSnapshot");

const appointmentsManagerList = document.getElementById("appointmentsManagerList");
const patientsList = document.getElementById("patientsList");
const plansList = document.getElementById("plansList");
const invoiceList = document.getElementById("invoiceList");
const inventoryList = document.getElementById("inventoryList");
const teamList = document.getElementById("teamList");

const addAppointmentBtn = document.getElementById("addAppointmentBtn");
const addPatientBtn = document.getElementById("addPatientBtn");
const restockAllBtn = document.getElementById("restockAllBtn");
const addInventoryBtn = document.getElementById("addInventoryBtn");
const patientModal = document.getElementById("patientModal");
const closePatientModalBtn = document.getElementById("closePatientModalBtn");
const cancelPatientModalBtn = document.getElementById("cancelPatientModalBtn");
const patientForm = document.getElementById("patientForm");
const patientNameInput = document.getElementById("patientNameInput");
const patientContactInput = document.getElementById("patientContactInput");
const patientEmailInput = document.getElementById("patientEmailInput");
const patientBirthdateInput = document.getElementById("patientBirthdateInput");
const appointmentModal = document.getElementById("appointmentModal");
const closeAppointmentModalBtn = document.getElementById("closeAppointmentModalBtn");
const cancelAppointmentModalBtn = document.getElementById("cancelAppointmentModalBtn");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentPatientInput = document.getElementById("appointmentPatientInput");
const appointmentDateInput = document.getElementById("appointmentDateInput");
const appointmentTimeInput = document.getElementById("appointmentTimeInput");
const appointmentProcedureInput = document.getElementById("appointmentProcedureInput");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventoryModalBtn = document.getElementById("closeInventoryModalBtn");
const cancelInventoryModalBtn = document.getElementById("cancelInventoryModalBtn");
const inventoryForm = document.getElementById("inventoryForm");
const inventoryItemNameInput = document.getElementById("inventoryItemNameInput");
const inventoryItemStockInput = document.getElementById("inventoryItemStockInput");
const addTeamBtn = document.getElementById("addTeamBtn");
const teamModal = document.getElementById("teamModal");
const closeTeamModalBtn = document.getElementById("closeTeamModalBtn");
const cancelTeamModalBtn = document.getElementById("cancelTeamModalBtn");
const teamForm = document.getElementById("teamForm");
const teamNameInput = document.getElementById("teamNameInput");
const teamRoleInput = document.getElementById("teamRoleInput");
const teamShiftDateInput = document.getElementById("teamShiftDateInput");
const teamShiftTimeInput = document.getElementById("teamShiftTimeInput");

function statusLabel(status) {
  if (status === "done") return "Completed";
  if (status === "next") return "In Progress";
  return "Scheduled";
}

function openPatientModal() {
  patientModal.classList.remove("hidden");
  patientNameInput.focus();
}

function closePatientModal() {
  patientModal.classList.add("hidden");
  patientForm.reset();
}

function openAppointmentModal() {
  appointmentModal.classList.remove("hidden");
  appointmentPatientInput.focus();
}

function closeAppointmentModal() {
  appointmentModal.classList.add("hidden");
  appointmentForm.reset();
}

function openInventoryModal() {
  inventoryModal.classList.remove("hidden");
  inventoryItemNameInput.focus();
}

function closeInventoryModal() {
  inventoryModal.classList.add("hidden");
  inventoryForm.reset();
}

function openTeamModal() {
  teamModal.classList.remove("hidden");
  teamNameInput.focus();
}

function closeTeamModal() {
  teamModal.classList.add("hidden");
  teamForm.reset();
}

function formatDateLabel(dateValue) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeLabel(timeValue) {
  if (!timeValue || !timeValue.includes(":")) return "";
  const [hoursStr, mins] = timeValue.split(":");
  const hours = Number(hoursStr);
  if (Number.isNaN(hours)) return "";
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${mins} ${ampm}`;
}

function formatTimestamp(dateObj) {
  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function parseAmount(amountText) {
  if (!amountText) return 0;
  const cleaned = String(amountText).replace(/[^0-9.]/g, "");
  const amount = Number(cleaned);
  return Number.isNaN(amount) ? 0 : amount;
}

function updateTodayLabel() {
  const now = new Date();
  todayLabel.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function syncDashboardFromState() {
  const today = state.dashboardRanges.today;
  if (!today) return;

  const appointmentStatuses = {
    pending: "waiting",
    "in-progress": "next",
    completed: "done"
  };

  const latestAppointments = [...state.appointmentsManager]
    .slice(-5)
    .reverse()
    .map((item) => ({
      time: item.time || "TBD",
      patient: item.patient || "Unknown Patient",
      procedure: item.procedure || "Consultation",
      status: appointmentStatuses[item.status] || "waiting"
    }));

  const waitingPatients = state.patients
    .filter((item) => !item.checkedIn)
    .slice(0, 5)
    .map((item) => ({
      patient: item.name,
      concern: "Patient intake",
      arrived: false
    }));

  const completedCount = state.appointmentsManager.filter((item) => item.status === "completed").length;
  const inProgressCount = state.appointmentsManager.filter((item) => item.status === "in-progress").length;
  const pendingCount = state.appointmentsManager.filter((item) => item.status === "pending").length;

  const pendingInsuranceTotal = state.invoices
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + parseAmount(item.amount), 0);

  today.appointments = latestAppointments.length ? latestAppointments : deepClone(DEFAULT_DASHBOARD_RANGES.today.appointments);
  today.queue = waitingPatients.length ? waitingPatients : deepClone(DEFAULT_DASHBOARD_RANGES.today.queue);
  today.quickCard = `${completedCount} completed, ${inProgressCount} in progress, ${pendingCount} pending`;
  today.completedProcedures = completedCount;
  today.pendingInsurance = `$${pendingInsuranceTotal.toLocaleString("en-US")}`;
}

function showView(view) {
  const validViews = new Set(["dashboard", "appointments", "patients", "treatment-plans", "billing", "inventory", "team"]);
  const safeView = validViews.has(view) ? view : "dashboard";
  state.currentView = safeView;

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === safeView);
  });

  viewSections.forEach((section) => {
    section.classList.toggle("active", section.dataset.view === safeView);
  });

  const viewTitles = {
    dashboard: "Dental Clinic Management System",
    appointments: "Appointments Manager",
    patients: "Patients Registry",
    "treatment-plans": "Treatment Plan Reviews",
    billing: "Billing and Invoices",
    inventory: "Inventory Control",
    team: "Team Coordination"
  };

  pageTitle.textContent = viewTitles[safeView] || "Dental Clinic Management System";
  chipRow.style.display = safeView === "dashboard" ? "flex" : "none";
  saveState();
}

function updateQuickCard(range) {
  const data = state.dashboardRanges[range] || state.dashboardRanges.today;
  const bookedTotal = range === "today" ? state.appointmentsManager.length : data.appointments.length + data.queue.length;
  bookedCount.textContent = `${bookedTotal} patients booked`;
  bookedBreakdown.textContent = data.quickCard;
}

function renderDashboardAppointments(items) {
  appointmentsList.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "appointment-item";
    li.innerHTML = `
      <p class="time-pill">${item.time}</p>
      <div>
        <p class="person">${item.patient}</p>
        <p class="subline">${item.procedure}</p>
      </div>
      <span class="status ${item.status}">${statusLabel(item.status)}</span>
    `;
    appointmentsList.appendChild(li);
  });
}

function renderDashboardQueue(items) {
  queueList.innerHTML = "";

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "queue-item";

    const statusClass = item.arrived ? "done" : "waiting";
    const statusText = item.arrived ? "Arrived" : "Waiting";

    li.innerHTML = `
      <div>
        <p class="person">${item.patient}</p>
        <p class="subline">${item.concern}</p>
      </div>
      <span class="status ${statusClass}">${statusText}</span>
      <button class="mark-btn" data-queue-index="${index}" ${item.arrived ? "disabled" : ""}>Mark Arrived</button>
    `;

    queueList.appendChild(li);
  });
}

function renderBillingSnapshot() {
  const paidCount = state.invoices.filter((item) => item.paid).length;
  const outstandingCount = state.invoices.filter((item) => !item.paid).length;

  billingSnapshot.innerHTML = `
    <div>
      <p class="money-label">Collected</p>
      <p class="money-value">$8,740</p>
    </div>
    <div>
      <p class="money-label">Outstanding</p>
      <p class="money-value">${outstandingCount}</p>
    </div>
    <div>
      <p class="money-label">Claims Sent</p>
      <p class="money-value">17</p>
    </div>
    <div>
      <p class="money-label">Paid Invoices</p>
      <p class="money-value">${paidCount}</p>
    </div>
  `;
}

function updateCheckedIn() {
  if (state.currentRange === "today") {
    const patientCheckedIn = state.patients.filter((item) => item.checkedIn).length;
    const arrived = state.dashboardRanges.today.queue.filter((item) => item.arrived).length;
    checkedInCount.textContent = patientCheckedIn + arrived;
    return;
  }

  const data = state.dashboardRanges[state.currentRange] || state.dashboardRanges.week;
  const arrived = data.queue.filter((item) => item.arrived).length;
  const base = state.currentRange === "week" ? 47 : 129;
  checkedInCount.textContent = base + arrived;
}

function loadRange(range) {
  const safeRange = state.dashboardRanges[range] ? range : "today";
  state.currentRange = safeRange;
  const data = state.dashboardRanges[safeRange];
  chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.range === safeRange));

  renderDashboardAppointments(data.appointments);
  renderDashboardQueue(data.queue);
  updateCheckedIn();
  updateQuickCard(safeRange);

  completedProcedures.textContent = data.completedProcedures;
  pendingInsurance.textContent = data.pendingInsurance;
  saveState();
}

function renderAppointmentsManager() {
  appointmentsManagerList.innerHTML = "";

  state.appointmentsManager.forEach((item) => {
    const nextStatus = item.status === "pending" ? "Start" : item.status === "in-progress" ? "Complete" : "Done";
    const disabled = item.status === "completed" ? "disabled" : "";

    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.patient} - ${item.time}</p>
        <p class="subline">${item.procedure}${item.dateLabel ? ` | ${item.dateLabel}` : ""}</p>
      </div>
      <span class="status ${item.status === "completed" ? "done" : item.status === "in-progress" ? "next" : "waiting"}">${item.status}</span>
      <button class="mark-btn" data-appointment-id="${item.id}" ${disabled}>${nextStatus}</button>
    `;
    appointmentsManagerList.appendChild(li);
  });
}

function renderPatients() {
  patientsList.innerHTML = "";

  state.patients.forEach((item) => {
    const age = calculateAge(item.birthdate);
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.name}</p>
        <div class="patient-meta">
          <p>Contact: ${item.contact}</p>
          <p>Email: ${item.email}</p>
          <p>Birthdate: ${item.birthdate || "N/A"}${age ? ` | Age: ${age}` : ""}</p>
        </div>
      </div>
      <span class="status ${item.checkedIn ? "done" : "waiting"}">${item.checkedIn ? "Checked In" : "Not Checked In"}</span>
      <button class="mark-btn" data-patient-id="${item.id}" ${item.checkedIn ? "disabled" : ""}>Check In</button>
    `;
    patientsList.appendChild(li);
  });
}

function renderPlans() {
  plansList.innerHTML = "";

  state.plans.forEach((item) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.name}</p>
        <p class="subline">${item.details}</p>
      </div>
      <span class="status ${item.approved ? "done" : "waiting"}">${item.approved ? "Approved" : "Pending"}</span>
      <button class="mark-btn" data-plan-id="${item.id}" ${item.approved ? "disabled" : ""}>Approve</button>
    `;
    plansList.appendChild(li);
  });
}

function renderInvoices() {
  invoiceList.innerHTML = "";

  state.invoices.forEach((item) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.code} - ${item.patient}</p>
        <p class="subline">Amount: ${item.amount}</p>
      </div>
      <span class="status ${item.paid ? "done" : "waiting"}">${item.paid ? "Paid" : "Unpaid"}</span>
      <div>
        <button class="mark-btn" data-invoice-id="${item.id}" ${item.paid ? "disabled" : ""}>Mark Paid</button>
        <button class="ghost-btn" data-reminder-id="${item.id}" ${item.paid ? "disabled" : ""}>${item.reminded ? "Reminder Sent" : "Send Reminder"}</button>
      </div>
    `;
    invoiceList.appendChild(li);
  });

  renderBillingSnapshot();
}

function renderInventory() {
  inventoryList.innerHTML = "";

  state.inventory.forEach((item) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.item}</p>
        <p class="subline">Stock: ${item.stock}</p>
      </div>
      <span class="status ${item.low ? "waiting" : "done"}">${item.low ? "Low Stock" : "Sufficient"}</span>
      <button class="mark-btn" data-inventory-id="${item.id}">Reorder</button>
    `;
    inventoryList.appendChild(li);
  });
}

function renderTeam() {
  teamList.innerHTML = "";

  state.team.forEach((item) => {
    const scheduleDate = item.shiftDate ? formatDateLabel(item.shiftDate) : "No date";
    const scheduleTime = item.shiftTime ? formatTimeLabel(item.shiftTime) : "No time";
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.name}</p>
        <div class="patient-meta">
          <p>${item.role}</p>
          <p>Shift: ${scheduleDate} ${scheduleTime}</p>
          <p>Last In: ${item.lastClockIn || "N/A"} | Last Out: ${item.lastClockOut || "N/A"}</p>
        </div>
      </div>
      <span class="status ${item.onDuty ? "done" : "waiting"}">${item.onDuty ? "On Duty" : "Off Duty"}</span>
      <button class="mark-btn" data-team-id="${item.id}">${item.onDuty ? "Clock Out" : "Clock In"}</button>
    `;
    teamList.appendChild(li);
  });
}

function renderAll() {
  updateTodayLabel();
  syncDashboardFromState();
  loadRange(state.currentRange);
  renderAppointmentsManager();
  renderPatients();
  renderPlans();
  renderInvoices();
  renderInventory();
  renderTeam();
}

function refreshDashboard() {
  syncDashboardFromState();
  if (state.currentView === "dashboard") loadRange(state.currentRange);
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    showView(item.dataset.view);
  });
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    loadRange(chip.dataset.range);
  });
});

queueList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-queue-index]");
  if (!button) return;

  const index = Number(button.dataset.queueIndex);
  const queueItem = state.dashboardRanges[state.currentRange].queue[index];
  if (!queueItem || queueItem.arrived) return;

  queueItem.arrived = true;
  renderDashboardQueue(state.dashboardRanges[state.currentRange].queue);
  updateCheckedIn();
  saveState();
});

appointmentsManagerList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-appointment-id]");
  if (!button) return;

  const id = Number(button.dataset.appointmentId);
  const appointment = state.appointmentsManager.find((item) => item.id === id);
  if (!appointment) return;

  if (appointment.status === "pending") appointment.status = "in-progress";
  else if (appointment.status === "in-progress") appointment.status = "completed";

  renderAppointmentsManager();
  refreshDashboard();
  saveState();
});

patientsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-patient-id]");
  if (!button) return;

  const id = Number(button.dataset.patientId);
  const patient = state.patients.find((item) => item.id === id);
  if (!patient) return;

  patient.checkedIn = true;
  renderPatients();
  refreshDashboard();
  saveState();
});

plansList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-plan-id]");
  if (!button) return;

  const id = Number(button.dataset.planId);
  const plan = state.plans.find((item) => item.id === id);
  if (!plan) return;

  plan.approved = true;
  renderPlans();
  saveState();
});

invoiceList.addEventListener("click", (event) => {
  const paidButton = event.target.closest("button[data-invoice-id]");
  if (paidButton) {
    const id = Number(paidButton.dataset.invoiceId);
    const invoice = state.invoices.find((item) => item.id === id);
    if (!invoice) return;

    invoice.paid = true;
    renderInvoices();
    refreshDashboard();
    saveState();
    return;
  }

  const reminderButton = event.target.closest("button[data-reminder-id]");
  if (!reminderButton) return;

  const reminderId = Number(reminderButton.dataset.reminderId);
  const reminderInvoice = state.invoices.find((item) => item.id === reminderId);
  if (!reminderInvoice || reminderInvoice.paid) return;

  reminderInvoice.reminded = true;
  renderInvoices();
  refreshDashboard();
  saveState();
});

inventoryList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-inventory-id]");
  if (!button) return;

  const id = Number(button.dataset.inventoryId);
  const item = state.inventory.find((entry) => entry.id === id);
  if (!item) return;

  item.stock += 20;
  item.low = item.stock < 10;
  renderInventory();
  saveState();
});

teamList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-team-id]");
  if (!button) return;

  const id = Number(button.dataset.teamId);
  const member = state.team.find((item) => item.id === id);
  if (!member) return;

  const now = formatTimestamp(new Date());
  if (member.onDuty) {
    member.onDuty = false;
    member.lastClockOut = now;
  } else {
    member.onDuty = true;
    member.lastClockIn = now;
  }

  renderTeam();
  saveState();
});

addAppointmentBtn.addEventListener("click", () => {
  openAppointmentModal();
});

addPatientBtn.addEventListener("click", () => {
  openPatientModal();
});

closePatientModalBtn.addEventListener("click", () => {
  closePatientModal();
});

cancelPatientModalBtn.addEventListener("click", () => {
  closePatientModal();
});

patientModal.addEventListener("click", (event) => {
  if (event.target === patientModal) closePatientModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!patientModal.classList.contains("hidden")) closePatientModal();
  if (!appointmentModal.classList.contains("hidden")) closeAppointmentModal();
  if (!inventoryModal.classList.contains("hidden")) closeInventoryModal();
  if (!teamModal.classList.contains("hidden")) closeTeamModal();
});

closeAppointmentModalBtn.addEventListener("click", () => {
  closeAppointmentModal();
});

cancelAppointmentModalBtn.addEventListener("click", () => {
  closeAppointmentModal();
});

appointmentModal.addEventListener("click", (event) => {
  if (event.target === appointmentModal) closeAppointmentModal();
});

appointmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const patient = appointmentPatientInput.value.trim();
  const dateValue = appointmentDateInput.value;
  const timeValue = appointmentTimeInput.value;
  const procedure = appointmentProcedureInput.value.trim();

  if (!patient || !dateValue || !timeValue || !procedure) return;

  state.appointmentsManager.push({
    id: nextId(state.appointmentsManager),
    patient,
    date: dateValue,
    dateLabel: formatDateLabel(dateValue),
    time: formatTimeLabel(timeValue),
    procedure,
    status: "pending"
  });

  renderAppointmentsManager();
  refreshDashboard();
  saveState();
  closeAppointmentModal();
});

addInventoryBtn.addEventListener("click", () => {
  openInventoryModal();
});

closeInventoryModalBtn.addEventListener("click", () => {
  closeInventoryModal();
});

cancelInventoryModalBtn.addEventListener("click", () => {
  closeInventoryModal();
});

inventoryModal.addEventListener("click", (event) => {
  if (event.target === inventoryModal) closeInventoryModal();
});

inventoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const itemName = inventoryItemNameInput.value.trim();
  const stockValue = Number(inventoryItemStockInput.value);
  if (!itemName || Number.isNaN(stockValue) || stockValue < 0) return;

  state.inventory.push({
    id: nextId(state.inventory),
    item: itemName,
    stock: stockValue,
    low: stockValue < 10
  });

  renderInventory();
  saveState();
  closeInventoryModal();
});

addTeamBtn.addEventListener("click", () => {
  openTeamModal();
});

closeTeamModalBtn.addEventListener("click", () => {
  closeTeamModal();
});

cancelTeamModalBtn.addEventListener("click", () => {
  closeTeamModal();
});

teamModal.addEventListener("click", (event) => {
  if (event.target === teamModal) closeTeamModal();
});

teamForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = teamNameInput.value.trim();
  const role = teamRoleInput.value.trim();
  const shiftDate = teamShiftDateInput.value;
  const shiftTime = teamShiftTimeInput.value;
  if (!name || !role || !shiftDate || !shiftTime) return;

  state.team.push({
    id: nextId(state.team),
    name,
    role,
    onDuty: false,
    shiftDate,
    shiftTime,
    lastClockIn: "",
    lastClockOut: ""
  });

  renderTeam();
  refreshDashboard();
  saveState();
  closeTeamModal();
});

patientForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = patientNameInput.value.trim();
  const contact = patientContactInput.value.trim();
  const email = patientEmailInput.value.trim();
  const birthdate = patientBirthdateInput.value;
  const age = calculateAge(birthdate);

  if (!name || !contact || !email || !birthdate || age === "") return;

  state.patients.push({
    id: nextId(state.patients),
    name,
    contact,
    email,
    birthdate,
    checkedIn: false
  });

  renderPatients();
  refreshDashboard();
  saveState();
  closePatientModal();
});

restockAllBtn.addEventListener("click", () => {
  state.inventory = state.inventory.map((item) => {
    if (!item.low) return item;
    const updatedStock = item.stock + 20;
    return { ...item, stock: updatedStock, low: updatedStock < 10 };
  });

  renderInventory();
  saveState();
});

showView(state.currentView || "dashboard");
chips.forEach((chip) => chip.classList.toggle("active", chip.dataset.range === state.currentRange));
renderAll();
