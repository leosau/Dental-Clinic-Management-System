const STORAGE_KEY = "dcms_state_v2";

const DEFAULT_DASHBOARD_RANGES = {
  today: {
    appointments: [],
    queue: [],
    quickCard: "No records yet",
    completedProcedures: 0,
    pendingInsurance: "$0"
  },
  week: {
    appointments: [],
    queue: [],
    quickCard: "No records yet",
    completedProcedures: 0,
    pendingInsurance: "$0"
  },
  month: {
    appointments: [],
    queue: [],
    quickCard: "No records yet",
    completedProcedures: 0,
    pendingInsurance: "$0"
  }
};

const DENTAL_STARTER_STOCK = [
  { item: "Local Anesthetic Carpules", stock: 60 },
  { item: "Topical Anesthetic Gel", stock: 20 },
  { item: "Nitrile Exam Gloves (Box)", stock: 40 },
  { item: "Surgical Masks (Box)", stock: 35 },
  { item: "Saliva Ejectors (Pack)", stock: 30 },
  { item: "High-Volume Suction Tips (Pack)", stock: 24 },
  { item: "Cotton Rolls (Bag)", stock: 50 },
  { item: "Gauze Pads (Pack)", stock: 45 },
  { item: "Composite Resin Syringes", stock: 18 },
  { item: "Etchant Gel", stock: 14 },
  { item: "Bonding Agent", stock: 16 },
  { item: "Glass Ionomer Cement", stock: 12 },
  { item: "Endodontic Files (Set)", stock: 22 },
  { item: "Irrigation Needles (Pack)", stock: 20 },
  { item: "Impression Material (PVS)", stock: 15 },
  { item: "Prophy Paste", stock: 25 },
  { item: "Fluoride Varnish", stock: 20 },
  { item: "Sterilization Pouches (Box)", stock: 28 }
];

const DEFAULT_STATE = {
  currentView: "dashboard",
  currentRange: "today",
  appointmentViewMode: "grouped",
  dashboardRanges: DEFAULT_DASHBOARD_RANGES,
  appointmentsManager: [
    
  ],
  patients: [],
  plans: [],
  invoices: [],
  inventory: [],
  team: []
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
  if (!Array.isArray(patients)) return [];
  return patients.map((patient) => {
    if (patient.contact && patient.email && patient.birthdate && patient.address && patient.medicalHistory) {
      return {
        ...patient,
        patientCode: patient.patientCode || "",
        exams: Array.isArray(patient.exams) ? patient.exams : [],
        lastPrescription: patient.lastPrescription || "",
        lastReport: patient.lastReport || ""
      };
    }
    return {
      id: patient.id,
      patientCode: patient.patientCode || "",
      name: patient.name || "Unnamed Patient",
      contact: patient.contact || "N/A",
      email: patient.email || "N/A",
      address: patient.address || "N/A",
      medicalHistory: patient.medicalHistory || "N/A",
      birthdate: patient.birthdate || "",
      checkedIn: Boolean(patient.checkedIn),
      exams: Array.isArray(patient.exams) ? patient.exams : [],
      lastPrescription: patient.lastPrescription || "",
      lastReport: patient.lastReport || ""
    };
  });
}

function normalizeAppointments(appointments) {
  if (!Array.isArray(appointments)) return [];
  return appointments.map((appointment) => ({
    ...appointment,
    dentist: appointment.dentist || "Unassigned",
    reminderSent: Boolean(appointment.reminderSent),
    followUpForPlanId: appointment.followUpForPlanId || null
  }));
}

function normalizeTeam(team) {
  if (!Array.isArray(team)) return [];
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

function normalizeInvoices(invoices) {
  if (!Array.isArray(invoices)) return [];
  return invoices.map((invoice) => {
    const totalAmount = typeof invoice.totalAmount === "number" ? invoice.totalAmount : parseAmount(invoice.amount);
    const paidAmount = typeof invoice.paidAmount === "number" ? invoice.paidAmount : (invoice.paid ? totalAmount : 0);
    const paymentType = invoice.paymentType === "installment" ? "installment" : "full";
    const downpayment = typeof invoice.downpayment === "number" ? invoice.downpayment : 0;
    const monthlyTerms = typeof invoice.monthlyTerms === "number" ? invoice.monthlyTerms : 0;
    const monthlyAmount = typeof invoice.monthlyAmount === "number"
      ? invoice.monthlyAmount
      : (paymentType === "installment" && monthlyTerms > 0
        ? (Math.max(totalAmount - downpayment, 0) / monthlyTerms)
        : 0);
    const monthsPaid = typeof invoice.monthsPaid === "number" ? invoice.monthsPaid : 0;
    const sanitizedPaid = Math.min(Math.max(paidAmount, 0), totalAmount);

    return {
      ...invoice,
      amount: invoice.amount || `$${totalAmount.toFixed(2)}`,
      paymentType,
      totalAmount,
      downpayment,
      monthlyTerms,
      monthlyAmount,
      paidAmount: sanitizedPaid,
      monthsPaid,
      paid: sanitizedPaid >= totalAmount,
      paymentMethod: invoice.paymentMethod || "",
      payments: Array.isArray(invoice.payments) ? invoice.payments : [],
      lastReceipt: invoice.lastReceipt || ""
    };
  });
}

function normalizePlans(plans) {
  if (!Array.isArray(plans)) return [];
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name || "Untitled Plan",
    details: plan.details || "No details",
    approved: Boolean(plan.approved),
    patient: plan.patient || "",
    startDate: plan.startDate || "",
    durationMonths: typeof plan.durationMonths === "number" ? plan.durationMonths : 0,
    invoiceCode: plan.invoiceCode || "",
    planType: plan.planType || "general",
    sessions: typeof plan.sessions === "number" ? plan.sessions : 0,
    estimatedCost: typeof plan.estimatedCost === "number" ? plan.estimatedCost : 0,
    executionCount: typeof plan.executionCount === "number" ? plan.executionCount : 0,
    lastExecutionAt: plan.lastExecutionAt || "",
    treatmentNotes: Array.isArray(plan.treatmentNotes) ? plan.treatmentNotes : []
  }));
}

function removeLegacyDemoAppointments(appointments) {
  if (!Array.isArray(appointments)) return [];
  const demoFingerprint = new Set([
    "nina perez|1:00 pm|tooth extraction",
    "miguel lao|1:30 pm|dental filling",
    "tina chu|2:00 pm|teeth cleaning"
  ]);

  return appointments.filter((item) => {
    const key = `${String(item.patient || "").toLowerCase()}|${String(item.time || "").toLowerCase()}|${String(item.procedure || "").toLowerCase()}`;
    return !demoFingerprint.has(key);
  });
}

function removeLegacyDemoPatients(patients) {
  const legacyNames = new Set(["carlo dizon", "aira gomez", "ivy co"]);
  return patients.filter((patient) => !legacyNames.has(String(patient.name || "").toLowerCase()));
}

function removeLegacyDemoPlans(plans) {
  const legacyNames = new Set(["j. tan - ortho plan", "m. cruz - implant plan", "l. ong - whitening plan"]);
  return plans.filter((plan) => !legacyNames.has(String(plan.name || "").toLowerCase()));
}

function removeLegacyDemoInvoices(invoices) {
  const legacyCodes = new Set(["inv-1024", "inv-1025", "inv-1026"]);
  return invoices.filter((invoice) => !legacyCodes.has(String(invoice.code || "").toLowerCase()));
}

function removeLegacyDemoInventory(inventory) {
  const legacyItems = new Set(["anesthetic cartridges", "latex gloves (box)", "impression material"]);
  return inventory.filter((item) => !legacyItems.has(String(item.item || "").toLowerCase()));
}

function removeLegacyDemoTeam(team) {
  const legacyNames = new Set(["dr. angela lim", "mark salonga", "eunice yap"]);
  return team.filter((member) => !legacyNames.has(String(member.name || "").toLowerCase()));
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
state.patients = removeLegacyDemoPatients(normalizePatients(state.patients));
state.team = removeLegacyDemoTeam(normalizeTeam(state.team));
state.dashboardRanges = normalizeDashboardRanges(state.dashboardRanges);
state.invoices = removeLegacyDemoInvoices(normalizeInvoices(state.invoices));
state.plans = removeLegacyDemoPlans(normalizePlans(state.plans));
state.appointmentsManager = normalizeAppointments(removeLegacyDemoAppointments(state.appointmentsManager));
state.inventory = removeLegacyDemoInventory(Array.isArray(state.inventory) ? state.inventory : []);

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
const toggleAppointmentsViewBtn = document.getElementById("toggleAppointmentsViewBtn");

const addAppointmentBtn = document.getElementById("addAppointmentBtn");
const addPatientBtn = document.getElementById("addPatientBtn");
const restockAllBtn = document.getElementById("restockAllBtn");
const addDentalStockBtn = document.getElementById("addDentalStockBtn");
const addInventoryBtn = document.getElementById("addInventoryBtn");
const addOrthoPlanBtn = document.getElementById("addOrthoPlanBtn");
const patientModal = document.getElementById("patientModal");
const closePatientModalBtn = document.getElementById("closePatientModalBtn");
const cancelPatientModalBtn = document.getElementById("cancelPatientModalBtn");
const patientForm = document.getElementById("patientForm");
const patientNameInput = document.getElementById("patientNameInput");
const patientContactInput = document.getElementById("patientContactInput");
const patientEmailInput = document.getElementById("patientEmailInput");
const patientAddressInput = document.getElementById("patientAddressInput");
const patientHistoryInput = document.getElementById("patientHistoryInput");
const patientBirthdateInput = document.getElementById("patientBirthdateInput");
const appointmentModal = document.getElementById("appointmentModal");
const closeAppointmentModalBtn = document.getElementById("closeAppointmentModalBtn");
const cancelAppointmentModalBtn = document.getElementById("cancelAppointmentModalBtn");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentPatientInput = document.getElementById("appointmentPatientInput");
const appointmentDateInput = document.getElementById("appointmentDateInput");
const appointmentTimeInput = document.getElementById("appointmentTimeInput");
const appointmentDentistInput = document.getElementById("appointmentDentistInput");
const appointmentProcedureInput = document.getElementById("appointmentProcedureInput");
const appointmentError = document.getElementById("appointmentError");
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
const billingPlanModal = document.getElementById("billingPlanModal");
const closeBillingPlanModalBtn = document.getElementById("closeBillingPlanModalBtn");
const cancelBillingPlanModalBtn = document.getElementById("cancelBillingPlanModalBtn");
const billingPlanForm = document.getElementById("billingPlanForm");
const planTotalInput = document.getElementById("planTotalInput");
const planDownpaymentInput = document.getElementById("planDownpaymentInput");
const planMonthsInput = document.getElementById("planMonthsInput");
const planInvoiceIdInput = document.getElementById("planInvoiceIdInput");
const orthoPlanModal = document.getElementById("orthoPlanModal");
const closeOrthoPlanModalBtn = document.getElementById("closeOrthoPlanModalBtn");
const cancelOrthoPlanModalBtn = document.getElementById("cancelOrthoPlanModalBtn");
const orthoPlanForm = document.getElementById("orthoPlanForm");
const orthoPatientNameInput = document.getElementById("orthoPatientNameInput");
const orthoTreatmentTypeInput = document.getElementById("orthoTreatmentTypeInput");
const orthoStartDateInput = document.getElementById("orthoStartDateInput");
const orthoMonthsInput = document.getElementById("orthoMonthsInput");
const orthoTimeInput = document.getElementById("orthoTimeInput");
const orthoTotalInput = document.getElementById("orthoTotalInput");
const orthoDownpaymentInput = document.getElementById("orthoDownpaymentInput");
const orthoPlanError = document.getElementById("orthoPlanError");
const orthoPlanSubmitBtn = orthoPlanForm.querySelector("button[type='submit']");
const examModal = document.getElementById("examModal");
const closeExamModalBtn = document.getElementById("closeExamModalBtn");
const cancelExamModalBtn = document.getElementById("cancelExamModalBtn");
const examForm = document.getElementById("examForm");
const examPatientIdInput = document.getElementById("examPatientIdInput");
const examSymptomsInput = document.getElementById("examSymptomsInput");
const examDiagnosisInput = document.getElementById("examDiagnosisInput");
const examChartInput = document.getElementById("examChartInput");
const treatmentModal = document.getElementById("treatmentModal");
const closeTreatmentModalBtn = document.getElementById("closeTreatmentModalBtn");
const cancelTreatmentModalBtn = document.getElementById("cancelTreatmentModalBtn");
const treatmentForm = document.getElementById("treatmentForm");
const treatmentPlanIdInput = document.getElementById("treatmentPlanIdInput");
const treatmentNotesInput = document.getElementById("treatmentNotesInput");
const treatmentMaterialsInput = document.getElementById("treatmentMaterialsInput");
const treatmentError = document.getElementById("treatmentError");
const treatmentPrescriptionInput = document.getElementById("treatmentPrescriptionInput");
const treatmentReportInput = document.getElementById("treatmentReportInput");
const paymentModal = document.getElementById("paymentModal");
const closePaymentModalBtn = document.getElementById("closePaymentModalBtn");
const cancelPaymentModalBtn = document.getElementById("cancelPaymentModalBtn");
const paymentForm = document.getElementById("paymentForm");
const paymentInvoiceIdInput = document.getElementById("paymentInvoiceIdInput");
const paymentAmountInput = document.getElementById("paymentAmountInput");
const paymentMethodInput = document.getElementById("paymentMethodInput");

let isCreatingOrthoPlan = false;
const expandedAppointmentGroups = new Set();

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
  populateAppointmentPatientOptions();
  appointmentModal.classList.remove("hidden");
  appointmentError.textContent = "";
  appointmentPatientInput.focus();
}

function closeAppointmentModal() {
  appointmentModal.classList.add("hidden");
  appointmentForm.reset();
  appointmentError.textContent = "";
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

function openBillingPlanModal(invoice) {
  if (!invoice) return;
  planInvoiceIdInput.value = String(invoice.id);
  planTotalInput.value = String(invoice.totalAmount || parseAmount(invoice.amount));
  planDownpaymentInput.value = String(invoice.downpayment || 0);
  planMonthsInput.value = String(invoice.monthlyTerms || 1);
  billingPlanModal.classList.remove("hidden");
  planTotalInput.focus();
}

function closeBillingPlanModal() {
  billingPlanModal.classList.add("hidden");
  billingPlanForm.reset();
}

function openOrthoPlanModal() {
  populateOrthoPatientOptions();
  orthoPlanModal.classList.remove("hidden");
  if (!orthoStartDateInput.value) {
    orthoStartDateInput.value = new Date().toISOString().slice(0, 10);
  }
  orthoPatientNameInput.focus();
}

function closeOrthoPlanModal() {
  orthoPlanModal.classList.add("hidden");
  orthoPlanForm.reset();
  orthoPlanError.textContent = "";
  isCreatingOrthoPlan = false;
  orthoPlanSubmitBtn.disabled = false;
  orthoPlanSubmitBtn.textContent = "Create Plan";
}

function openExamModal(patientId) {
  examPatientIdInput.value = String(patientId);
  examModal.classList.remove("hidden");
  examSymptomsInput.focus();
}

function closeExamModal() {
  examModal.classList.add("hidden");
  examForm.reset();
}

function openTreatmentModal(planId) {
  treatmentPlanIdInput.value = String(planId);
  treatmentModal.classList.remove("hidden");
  treatmentNotesInput.focus();
}

function closeTreatmentModal() {
  treatmentModal.classList.add("hidden");
  treatmentForm.reset();
  treatmentError.textContent = "";
}

function openPaymentModal(invoiceId, suggestedAmount) {
  paymentInvoiceIdInput.value = String(invoiceId);
  paymentAmountInput.value = String(Number(suggestedAmount || 0).toFixed(2));
  paymentModal.classList.remove("hidden");
  paymentAmountInput.focus();
}

function closePaymentModal() {
  paymentModal.classList.add("hidden");
  paymentForm.reset();
}

function setOrthoPlanError(message) {
  orthoPlanError.textContent = message || "";
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

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function addMonths(dateValue, monthsToAdd) {
  const base = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  const originalDate = base.getDate();
  base.setMonth(base.getMonth() + monthsToAdd);
  if (base.getDate() !== originalDate) {
    base.setDate(0);
  }
  return base.toISOString().slice(0, 10);
}

function addDays(dateValue, daysToAdd) {
  const base = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + daysToAdd);
  return base.toISOString().slice(0, 10);
}

function getTreatmentTemplate(treatmentType, orthoMonths) {
  const months = Math.max(1, Number(orthoMonths) || 12);
  const templates = {
    ortho: {
      label: "Orthodontic Adjustment",
      sessions: months,
      intervalType: "month",
      intervalValue: 1,
      durationMonths: months
    },
    cleaning: {
      label: "Dental Cleaning",
      sessions: 2,
      intervalType: "month",
      intervalValue: 6,
      durationMonths: 12
    },
    root_canal: {
      label: "Root Canal Session",
      sessions: 3,
      intervalType: "day",
      intervalValue: 14,
      durationMonths: 2
    },
    extraction: {
      label: "Extraction / Follow-up",
      sessions: 2,
      intervalType: "day",
      intervalValue: 7,
      durationMonths: 1
    },
    whitening: {
      label: "Teeth Whitening Session",
      sessions: 3,
      intervalType: "day",
      intervalValue: 7,
      durationMonths: 1
    },
    implant: {
      label: "Implant Stage",
      sessions: 3,
      intervalType: "month",
      intervalValue: 3,
      durationMonths: 6
    }
  };
  return templates[treatmentType] || templates.ortho;
}

function getTreatmentDisplayName(treatmentType) {
  const names = {
    ortho: "Braces (Ortho)",
    cleaning: "Cleaning",
    root_canal: "Root Canal",
    extraction: "Extraction",
    whitening: "Whitening",
    implant: "Implant"
  };
  return names[treatmentType] || "Treatment";
}

function nextInvoiceCode() {
  const maxSuffix = state.invoices.reduce((max, invoice) => {
    const match = String(invoice.code || "").match(/INV-(\d+)/i);
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 1023);
  return `INV-${maxSuffix + 1}`;
}

function nextPatientCode() {
  const maxSuffix = state.patients.reduce((max, patient) => {
    const match = String(patient.patientCode || "").match(/PT-(\d+)/i);
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 1000);
  return `PT-${maxSuffix + 1}`;
}

function nextReceiptCode() {
  let max = 1000;
  state.invoices.forEach((invoice) => {
    const candidates = [invoice.lastReceipt, ...(Array.isArray(invoice.payments) ? invoice.payments.map((p) => p.receipt) : [])];
    candidates.forEach((value) => {
      const match = String(value || "").match(/OR-(\d+)/i);
      if (!match) return;
      const num = Number(match[1]);
      if (!Number.isNaN(num)) max = Math.max(max, num);
    });
  });
  return `OR-${max + 1}`;
}

function populateAppointmentPatientOptions() {
  const previousValue = appointmentPatientInput.value;
  appointmentPatientInput.innerHTML = '<option value="" selected disabled>Select patient</option>';

  state.patients.forEach((patient) => {
    const option = document.createElement("option");
    option.value = patient.name;
    option.textContent = patient.patientCode ? `${patient.name} (${patient.patientCode})` : patient.name;
    appointmentPatientInput.appendChild(option);
  });

  if (previousValue && state.patients.some((patient) => patient.name === previousValue)) {
    appointmentPatientInput.value = previousValue;
  }
}

function populateOrthoPatientOptions() {
  const previousValue = orthoPatientNameInput.value;
  orthoPatientNameInput.innerHTML = '<option value="" selected disabled>Select patient</option>';

  state.patients.forEach((patient) => {
    const option = document.createElement("option");
    option.value = patient.name;
    option.textContent = patient.patientCode ? `${patient.name} (${patient.patientCode})` : patient.name;
    orthoPatientNameInput.appendChild(option);
  });

  if (previousValue && state.patients.some((patient) => patient.name === previousValue)) {
    orthoPatientNameInput.value = previousValue;
  }
}

function parseAmount(amountText) {
  if (!amountText) return 0;
  const cleaned = String(amountText).replace(/[^0-9.]/g, "");
  const amount = Number(cleaned);
  return Number.isNaN(amount) ? 0 : amount;
}

function loadDentalStarterStock() {
  DENTAL_STARTER_STOCK.forEach((starter) => {
    const existing = state.inventory.find((item) => String(item.item || "").toLowerCase() === starter.item.toLowerCase());
    if (existing) return;
    state.inventory.push({
      id: nextId(state.inventory),
      item: starter.item,
      stock: starter.stock,
      low: starter.stock < 10
    });
  });
}

function parseMaterialsUsage(rawText) {
  const parts = String(rawText || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) {
    return { error: "Please provide materials using Item:Qty format." };
  }

  const usageMap = new Map();
  for (const part of parts) {
    const match = part.match(/^(.*?)(?::|x)\s*(\d+)$/i);
    if (!match) {
      return { error: `Invalid material entry "${part}". Use Item:Qty format.` };
    }

    const name = match[1].trim();
    const qty = Number(match[2]);
    if (!name || Number.isNaN(qty) || qty <= 0) {
      return { error: `Invalid quantity for "${part}".` };
    }

    const key = name.toLowerCase();
    usageMap.set(key, {
      name,
      qty: (usageMap.get(key)?.qty || 0) + qty
    });
  }

  return { items: Array.from(usageMap.values()) };
}

function applyInventoryUsage(materialsText) {
  const parsed = parseMaterialsUsage(materialsText);
  if (parsed.error) return { error: parsed.error };

  const missing = [];
  const insufficient = [];
  const changes = [];

  parsed.items.forEach((usage) => {
    const inventoryItem = state.inventory.find((item) => String(item.item || "").toLowerCase() === usage.name.toLowerCase());
    if (!inventoryItem) {
      missing.push(usage.name);
      return;
    }
    if (inventoryItem.stock < usage.qty) {
      insufficient.push(`${usage.name} (need ${usage.qty}, stock ${inventoryItem.stock})`);
      return;
    }
    changes.push({ inventoryItem, qty: usage.qty });
  });

  if (missing.length) {
    return { error: `Item not found in inventory: ${missing.join(", ")}.` };
  }
  if (insufficient.length) {
    return { error: `Insufficient stock: ${insufficient.join(", ")}.` };
  }

  changes.forEach(({ inventoryItem, qty }) => {
    inventoryItem.stock -= qty;
    inventoryItem.low = inventoryItem.stock < 10;
  });

  return { ok: true };
}

function getAppointmentGroupId(appointment) {
  if (appointment.followUpForPlanId) return `plan-${appointment.followUpForPlanId}`;
  const orthoMatch = String(appointment.procedure || "").match(/Orthodontic Adjustment \((\d+)\/(\d+)\)/i);
  if (orthoMatch) {
    return `ortho-${String(appointment.patient || "").toLowerCase()}-${orthoMatch[2]}`;
  }
  return `single-${appointment.id}`;
}

function updateAppointmentsViewToggleLabel() {
  if (!toggleAppointmentsViewBtn) return;
  const grouped = state.appointmentViewMode === "grouped";
  toggleAppointmentsViewBtn.textContent = grouped ? "Grouped View: On" : "Grouped View: Off";
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
    .reduce((sum, item) => sum + Math.max((item.totalAmount || parseAmount(item.amount)) - (item.paidAmount || 0), 0), 0);

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
  const collected = state.invoices.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
  const completedTreatments = state.appointmentsManager.filter((item) => item.status === "completed").length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const dailyPatients = new Set(
    state.appointmentsManager
      .filter((item) => (item.date || "") === todayIso)
      .map((item) => item.patient)
  ).size;
  const dentistCount = {};
  state.appointmentsManager.forEach((item) => {
    if (item.status !== "completed") return;
    const key = item.dentist || "Unassigned";
    dentistCount[key] = (dentistCount[key] || 0) + 1;
  });
  const topDentist = Object.entries(dentistCount).sort((a, b) => b[1] - a[1])[0];
  const dentistPerf = topDentist ? `${topDentist[0]} (${topDentist[1]})` : "No data";

  billingSnapshot.innerHTML = `
    <div>
      <p class="money-label">Revenue Collected</p>
      <p class="money-value">${formatCurrency(collected)}</p>
    </div>
    <div>
      <p class="money-label">Daily Patients</p>
      <p class="money-value">${dailyPatients}</p>
    </div>
    <div>
      <p class="money-label">Treatments Done</p>
      <p class="money-value">${completedTreatments}</p>
    </div>
    <div>
      <p class="money-label">Top Dentist</p>
      <p class="money-value">${dentistPerf}</p>
    </div>
    <div>
      <p class="money-label">Outstanding Invoices</p>
      <p class="money-value">${outstandingCount}</p>
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
  updateAppointmentsViewToggleLabel();

  const renderItemRow = (item) => {
    const nextStatus = item.status === "pending" ? "Start" : item.status === "in-progress" ? "Complete" : "Done";
    const disabled = item.status === "completed" ? "disabled" : "";

    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.patient} - ${item.time}</p>
        <p class="subline">${item.procedure}${item.dateLabel ? ` | ${item.dateLabel}` : ""} | Dentist: ${item.dentist || "Unassigned"}</p>
      </div>
      <span class="status ${item.status === "completed" ? "done" : item.status === "in-progress" ? "next" : "waiting"}">${item.status}</span>
      <div>
        <button class="ghost-btn" data-remind-appointment-id="${item.id}" ${item.reminderSent ? "disabled" : ""}>${item.reminderSent ? "Reminder Sent" : "Send Reminder"}</button>
        <button class="mark-btn" data-appointment-id="${item.id}" ${disabled}>${nextStatus}</button>
        <button class="danger-btn" data-delete-appointment-id="${item.id}">Remove</button>
      </div>
    `;
    return li;
  };

  if (state.appointmentViewMode !== "grouped") {
    state.appointmentsManager.forEach((item) => {
      appointmentsManagerList.appendChild(renderItemRow(item));
    });
    return;
  }

  const groupedMap = new Map();
  state.appointmentsManager.forEach((item) => {
    const groupId = getAppointmentGroupId(item);
    if (!groupedMap.has(groupId)) groupedMap.set(groupId, []);
    groupedMap.get(groupId).push(item);
  });

  groupedMap.forEach((items, groupId) => {
    if (items.length === 1 && groupId.startsWith("single-")) {
      appointmentsManagerList.appendChild(renderItemRow(items[0]));
      return;
    }

    const sorted = [...items].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const patient = sorted[0].patient || "Patient";
    const completed = sorted.filter((item) => item.status === "completed").length;
    const pending = sorted.filter((item) => item.status !== "completed").length;
    const nextVisit = sorted.find((item) => item.status !== "completed");
    const summary = document.createElement("li");
    summary.className = "queue-item";
    summary.innerHTML = `
      <div>
        <p class="person">${patient} - Grouped Plan</p>
        <p class="subline">Sessions: ${completed}/${sorted.length} completed | Pending: ${pending}${nextVisit ? ` | Next: ${nextVisit.dateLabel || "TBD"} ${nextVisit.time || ""}` : ""}</p>
      </div>
      <span class="status ${pending === 0 ? "done" : "next"}">${pending === 0 ? "Completed" : "Ongoing"}</span>
      <div>
        <button class="ghost-btn" data-toggle-group-id="${groupId}">${expandedAppointmentGroups.has(groupId) ? "Hide Sessions" : "Show Sessions"}</button>
      </div>
    `;
    appointmentsManagerList.appendChild(summary);

    if (expandedAppointmentGroups.has(groupId)) {
      sorted.forEach((item) => {
        appointmentsManagerList.appendChild(renderItemRow(item));
      });
    }
  });
}

function renderPatients() {
  patientsList.innerHTML = "";
  populateAppointmentPatientOptions();
  populateOrthoPatientOptions();

  state.patients.forEach((item) => {
    const age = calculateAge(item.birthdate);
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.name} ${item.patientCode ? `(${item.patientCode})` : ""}</p>
        <div class="patient-meta">
          <p>Contact: ${item.contact}</p>
          <p>Email: ${item.email}</p>
          <p>Address: ${item.address || "N/A"}</p>
          <p>History: ${item.medicalHistory || "N/A"}</p>
          <p>Birthdate: ${item.birthdate || "N/A"}${age ? ` | Age: ${age}` : ""}</p>
          <p>Exams recorded: ${Array.isArray(item.exams) ? item.exams.length : 0}</p>
        </div>
      </div>
      <span class="status ${item.checkedIn ? "done" : "waiting"}">${item.checkedIn ? "Checked In" : "Not Checked In"}</span>
      <div>
        <button class="ghost-btn" data-exam-patient-id="${item.id}">Exam</button>
        <button class="ghost-btn" data-view-report-patient-id="${item.id}" ${item.lastReport ? "" : "disabled"}>View Report</button>
        <button class="mark-btn" data-patient-id="${item.id}" ${item.checkedIn ? "disabled" : ""}>Check In</button>
        <button class="danger-btn" data-delete-patient-id="${item.id}">Remove</button>
      </div>
    `;
    patientsList.appendChild(li);
  });
}

function renderPlans() {
  plansList.innerHTML = "";

  state.plans.forEach((item) => {
    const startDateLabel = item.startDate ? formatDateLabel(item.startDate) : "N/A";
    const sessions = item.sessions || item.durationMonths || 1;
    const treatmentName = getTreatmentDisplayName(item.planType);
    const planMeta = `Type: ${treatmentName} | Start: ${startDateLabel} | Duration: ${item.durationMonths || 1} months | Sessions: ${sessions} | Est. Cost: ${formatCurrency(item.estimatedCost || 0)} | Invoice: ${item.invoiceCode || "N/A"}`;

    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.name}</p>
        <p class="subline">${planMeta}</p>
      </div>
      <span class="status ${item.approved ? "done" : "waiting"}">${item.approved ? "Approved" : "Pending"}</span>
      <div>
        <button class="mark-btn" data-plan-id="${item.id}" ${item.approved ? "disabled" : ""}>Approve</button>
        <button class="ghost-btn" data-execute-plan-id="${item.id}">Execute</button>
        <button class="ghost-btn" data-followup-plan-id="${item.id}">Follow-up</button>
        <button class="danger-btn" data-delete-plan-id="${item.id}">Remove</button>
      </div>
    `;
    plansList.appendChild(li);
  });
}

function renderInvoices() {
  invoiceList.innerHTML = "";

  state.invoices.forEach((item) => {
    const totalAmount = item.totalAmount || parseAmount(item.amount);
    const paidAmount = item.paidAmount || 0;
    const remaining = Math.max(totalAmount - paidAmount, 0);
    const isInstallment = item.paymentType === "installment";
    const statusText = item.paid ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";
    const statusClass = item.paid ? "done" : paidAmount > 0 ? "next" : "waiting";

    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div>
        <p class="person">${item.code} - ${item.patient}</p>
        <p class="subline">
          Total: ${formatCurrency(totalAmount)} | Paid: ${formatCurrency(paidAmount)} | Remaining: ${formatCurrency(remaining)}
        </p>
        <p class="subline">
          ${isInstallment ? `Installment (${item.monthlyTerms} mo) - Monthly: ${formatCurrency(item.monthlyAmount)} | Downpayment: ${formatCurrency(item.downpayment)}` : "Full payment"}
        </p>
        <p class="subline">Method: ${item.paymentMethod || "Not set"}${item.lastReceipt ? ` | Receipt: ${item.lastReceipt}` : ""}</p>
      </div>
        <span class="status ${statusClass}">${statusText}</span>
        <div>
          <button class="ghost-btn" data-plan-id="${item.id}" ${item.paid ? "disabled" : ""}>Set Plan</button>
          <button class="mark-btn" data-monthly-id="${item.id}" ${(item.paid || !isInstallment) ? "disabled" : ""}>Record Monthly</button>
          <button class="mark-btn" data-invoice-id="${item.id}" ${item.paid ? "disabled" : ""}>Record Full</button>
          <button class="ghost-btn" data-reminder-id="${item.id}" ${item.paid ? "disabled" : ""}>${item.reminded ? "Reminder Sent" : "Send Reminder"}</button>
          <button class="danger-btn" data-delete-invoice-id="${item.id}">Remove</button>
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
      <div>
        <button class="mark-btn" data-inventory-id="${item.id}">Reorder</button>
        <button class="danger-btn" data-delete-inventory-id="${item.id}">Remove</button>
      </div>
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
      <div>
        <button class="mark-btn" data-team-id="${item.id}">${item.onDuty ? "Clock Out" : "Clock In"}</button>
        <button class="danger-btn" data-delete-team-id="${item.id}">Remove</button>
      </div>
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
  const groupButton = event.target.closest("button[data-toggle-group-id]");
  if (groupButton) {
    const groupId = groupButton.dataset.toggleGroupId;
    if (!groupId) return;
    if (expandedAppointmentGroups.has(groupId)) expandedAppointmentGroups.delete(groupId);
    else expandedAppointmentGroups.add(groupId);
    renderAppointmentsManager();
    return;
  }

  const remindButton = event.target.closest("button[data-remind-appointment-id]");
  if (remindButton) {
    const remindId = Number(remindButton.dataset.remindAppointmentId);
    const appointment = state.appointmentsManager.find((item) => item.id === remindId);
    if (!appointment) return;
    appointment.reminderSent = true;
    renderAppointmentsManager();
    saveState();
    return;
  }

  const deleteButton = event.target.closest("button[data-delete-appointment-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deleteAppointmentId);
    state.appointmentsManager = state.appointmentsManager.filter((item) => item.id !== deleteId);
    renderAppointmentsManager();
    refreshDashboard();
    saveState();
    return;
  }

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
  const examButton = event.target.closest("button[data-exam-patient-id]");
  if (examButton) {
    const examId = Number(examButton.dataset.examPatientId);
    openExamModal(examId);
    return;
  }

  const reportButton = event.target.closest("button[data-view-report-patient-id]");
  if (reportButton) {
    const reportId = Number(reportButton.dataset.viewReportPatientId);
    const patient = state.patients.find((item) => item.id === reportId);
    if (!patient || !patient.lastReport) return;
    alert(`Medical Report for ${patient.name}\n\n${patient.lastReport}`);
    return;
  }

  const deleteButton = event.target.closest("button[data-delete-patient-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deletePatientId);
    state.patients = state.patients.filter((item) => item.id !== deleteId);
    renderPatients();
    refreshDashboard();
    saveState();
    return;
  }

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
  const executeButton = event.target.closest("button[data-execute-plan-id]");
  if (executeButton) {
    const executeId = Number(executeButton.dataset.executePlanId);
    openTreatmentModal(executeId);
    return;
  }

  const followUpButton = event.target.closest("button[data-followup-plan-id]");
  if (followUpButton) {
    const followUpId = Number(followUpButton.dataset.followupPlanId);
    const plan = state.plans.find((item) => item.id === followUpId);
    if (!plan || !plan.startDate) return;

    const nextIndex = state.appointmentsManager.filter((item) => item.followUpForPlanId === plan.id).length + 1;
    const followDate = addMonths(plan.startDate, nextIndex);
    state.appointmentsManager.push({
      id: nextId(state.appointmentsManager),
      patient: plan.patient || plan.name,
      date: followDate,
      dateLabel: formatDateLabel(followDate),
      time: "9:00 AM",
      dentist: "Dr. Reyes",
      procedure: `Follow-up Visit (${nextIndex})`,
      status: "pending",
      reminderSent: false,
      followUpForPlanId: plan.id
    });
    renderAppointmentsManager();
    refreshDashboard();
    saveState();
    return;
  }

  const deleteButton = event.target.closest("button[data-delete-plan-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deletePlanId);
    state.plans = state.plans.filter((item) => item.id !== deleteId);
    renderPlans();
    saveState();
    return;
  }

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
  const deleteButton = event.target.closest("button[data-delete-invoice-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deleteInvoiceId);
    state.invoices = state.invoices.filter((item) => item.id !== deleteId);
    renderInvoices();
    refreshDashboard();
    saveState();
    return;
  }

  const planButton = event.target.closest("button[data-plan-id]");
  if (planButton) {
    const id = Number(planButton.dataset.planId);
    const invoice = state.invoices.find((item) => item.id === id);
    if (!invoice) return;
    openBillingPlanModal(invoice);
    return;
  }

  const monthlyButton = event.target.closest("button[data-monthly-id]");
  if (monthlyButton) {
    const id = Number(monthlyButton.dataset.monthlyId);
    const invoice = state.invoices.find((item) => item.id === id);
    if (!invoice || invoice.paid || invoice.paymentType !== "installment") return;
    const remaining = Math.max(invoice.totalAmount - invoice.paidAmount, 0);
    const suggested = Math.min(invoice.monthlyAmount || remaining, remaining);
    openPaymentModal(id, suggested);
    return;
  }

  const paidButton = event.target.closest("button[data-invoice-id]");
  if (paidButton) {
    const id = Number(paidButton.dataset.invoiceId);
    const invoice = state.invoices.find((item) => item.id === id);
    if (!invoice) return;
    const remaining = Math.max((invoice.totalAmount || parseAmount(invoice.amount)) - (invoice.paidAmount || 0), 0);
    openPaymentModal(id, remaining);
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
  const deleteButton = event.target.closest("button[data-delete-inventory-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deleteInventoryId);
    state.inventory = state.inventory.filter((item) => item.id !== deleteId);
    renderInventory();
    saveState();
    return;
  }

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
  const deleteButton = event.target.closest("button[data-delete-team-id]");
  if (deleteButton) {
    const deleteId = Number(deleteButton.dataset.deleteTeamId);
    state.team = state.team.filter((item) => item.id !== deleteId);
    renderTeam();
    saveState();
    return;
  }

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

toggleAppointmentsViewBtn.addEventListener("click", () => {
  state.appointmentViewMode = state.appointmentViewMode === "grouped" ? "list" : "grouped";
  renderAppointmentsManager();
  saveState();
});

addPatientBtn.addEventListener("click", () => {
  openPatientModal();
});

closePatientModalBtn.addEventListener("click", () => {
  closePatientModal();
});

cancelPatientModalBtn.addEventListener("click", () => {
  patientForm.reset();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
});

closeAppointmentModalBtn.addEventListener("click", () => {
  closeAppointmentModal();
});

cancelAppointmentModalBtn.addEventListener("click", () => {
  appointmentForm.reset();
});

appointmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appointmentError.textContent = "";

  const patient = appointmentPatientInput.value.trim();
  const dateValue = appointmentDateInput.value;
  const timeValue = appointmentTimeInput.value;
  const dentist = appointmentDentistInput.value.trim();
  const procedure = appointmentProcedureInput.value.trim();

  if (!patient || !dateValue || !timeValue || !dentist || !procedure) {
    appointmentError.textContent = "Please complete all appointment fields.";
    return;
  }

  const patientExists = state.patients.some((item) => item.name === patient);
  if (!patientExists) {
    appointmentError.textContent = "Please select a patient from the registered patient list.";
    return;
  }

  const hasConflict = state.appointmentsManager.some((item) =>
    (item.date || "") === dateValue &&
    String(item.time || "") === formatTimeLabel(timeValue) &&
    String(item.dentist || "") === dentist &&
    item.status !== "completed"
  );
  if (hasConflict) {
    appointmentError.textContent = "Selected dentist is not available for this date and time.";
    return;
  }

  state.appointmentsManager.push({
    id: nextId(state.appointmentsManager),
    patient,
    date: dateValue,
    dateLabel: formatDateLabel(dateValue),
    time: formatTimeLabel(timeValue),
    dentist,
    procedure,
    status: "pending",
    reminderSent: false
  });

  renderAppointmentsManager();
  refreshDashboard();
  saveState();
  closeAppointmentModal();
});

addInventoryBtn.addEventListener("click", () => {
  openInventoryModal();
});

addDentalStockBtn.addEventListener("click", () => {
  loadDentalStarterStock();
  renderInventory();
  saveState();
});

addOrthoPlanBtn.addEventListener("click", () => {
  openOrthoPlanModal();
});

closeInventoryModalBtn.addEventListener("click", () => {
  closeInventoryModal();
});

cancelInventoryModalBtn.addEventListener("click", () => {
  inventoryForm.reset();
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
  teamForm.reset();
});

closeExamModalBtn.addEventListener("click", () => {
  closeExamModal();
});

cancelExamModalBtn.addEventListener("click", () => {
  examForm.reset();
});

examForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const patientId = Number(examPatientIdInput.value);
  const symptoms = examSymptomsInput.value.trim();
  const diagnosis = examDiagnosisInput.value.trim();
  const chart = examChartInput.value.trim();
  if (!patientId || !symptoms || !diagnosis || !chart) return;

  const patient = state.patients.find((item) => item.id === patientId);
  if (!patient) return;

  const examEntry = {
    date: new Date().toISOString(),
    symptoms,
    diagnosis,
    chart
  };
  patient.exams = Array.isArray(patient.exams) ? patient.exams : [];
  patient.exams.push(examEntry);
  patient.lastDiagnosis = diagnosis;

  renderPatients();
  saveState();
  closeExamModal();
});

closeTreatmentModalBtn.addEventListener("click", () => {
  closeTreatmentModal();
});

cancelTreatmentModalBtn.addEventListener("click", () => {
  treatmentForm.reset();
});

treatmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  treatmentError.textContent = "";

  const planId = Number(treatmentPlanIdInput.value);
  const notes = treatmentNotesInput.value.trim();
  const materials = treatmentMaterialsInput.value.trim();
  const prescription = treatmentPrescriptionInput.value.trim();
  const report = treatmentReportInput.value.trim();
  if (!planId || !notes || !materials || !prescription || !report) return;

  const inventoryResult = applyInventoryUsage(materials);
  if (inventoryResult.error) {
    treatmentError.textContent = inventoryResult.error;
    return;
  }

  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) return;

  plan.executionCount = (plan.executionCount || 0) + 1;
  plan.lastExecutionAt = formatTimestamp(new Date());
  plan.treatmentNotes = Array.isArray(plan.treatmentNotes) ? plan.treatmentNotes : [];
  plan.treatmentNotes.push({ notes, materials, prescription, report, date: new Date().toISOString() });
  plan.details = `Last execution: ${plan.lastExecutionAt}`;

  const patient = state.patients.find((item) => String(item.name || "").toLowerCase() === String(plan.patient || "").toLowerCase());
  if (patient) {
    patient.lastPrescription = prescription;
    patient.lastReport = report;
  }

  renderPlans();
  renderPatients();
  renderInventory();
  saveState();
  closeTreatmentModal();
});

closePaymentModalBtn.addEventListener("click", () => {
  closePaymentModal();
});

cancelPaymentModalBtn.addEventListener("click", () => {
  paymentForm.reset();
});

paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const invoiceId = Number(paymentInvoiceIdInput.value);
  const amount = Number(paymentAmountInput.value);
  const method = paymentMethodInput.value.trim();
  if (!invoiceId || Number.isNaN(amount) || amount <= 0 || !method) return;

  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;

  const total = invoice.totalAmount || parseAmount(invoice.amount);
  const remaining = Math.max(total - (invoice.paidAmount || 0), 0);
  const applied = Math.min(amount, remaining);
  if (applied <= 0) return;

  const receipt = nextReceiptCode();
  invoice.paidAmount = (invoice.paidAmount || 0) + applied;
  invoice.paid = invoice.paidAmount >= total;
  invoice.paymentMethod = method;
  invoice.payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  invoice.payments.push({
    date: new Date().toISOString(),
    amount: applied,
    method,
    receipt
  });
  invoice.lastReceipt = receipt;
  if (invoice.paymentType === "installment" && invoice.monthlyAmount > 0) {
    invoice.monthsPaid = (invoice.monthsPaid || 0) + 1;
  }

  renderInvoices();
  refreshDashboard();
  saveState();
  closePaymentModal();
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

closeBillingPlanModalBtn.addEventListener("click", () => {
  closeBillingPlanModal();
});

cancelBillingPlanModalBtn.addEventListener("click", () => {
  billingPlanForm.reset();
});

billingPlanForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const invoiceId = Number(planInvoiceIdInput.value);
  const total = Number(planTotalInput.value);
  const down = Number(planDownpaymentInput.value);
  const months = Number(planMonthsInput.value);
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) return;
  if (Number.isNaN(total) || Number.isNaN(down) || Number.isNaN(months)) return;
  if (total <= 0 || down < 0 || down > total || months < 1) return;

  const remainingAfterDown = total - down;
  const monthly = remainingAfterDown > 0 ? remainingAfterDown / months : 0;

  invoice.totalAmount = total;
  invoice.amount = formatCurrency(total);
  invoice.paymentType = "installment";
  invoice.downpayment = down;
  invoice.monthlyTerms = months;
  invoice.monthlyAmount = monthly;
  invoice.paidAmount = down;
  invoice.monthsPaid = 0;
  invoice.paid = down >= total;

  renderInvoices();
  refreshDashboard();
  saveState();
  closeBillingPlanModal();
});

closeOrthoPlanModalBtn.addEventListener("click", () => {
  closeOrthoPlanModal();
});

cancelOrthoPlanModalBtn.addEventListener("click", () => {
  orthoPlanForm.reset();
  setOrthoPlanError("");
});

orthoPlanForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setOrthoPlanError("");
  if (isCreatingOrthoPlan) return;

  const patientName = orthoPatientNameInput.value.trim();
  const treatmentType = orthoTreatmentTypeInput.value.trim();
  const startDate = orthoStartDateInput.value;
  const months = Number(orthoMonthsInput.value);
  const adjustTime = orthoTimeInput.value;
  const packageTotal = Number(orthoTotalInput.value);
  const downpayment = Number(orthoDownpaymentInput.value);

  if (!patientName || !treatmentType || !startDate || !adjustTime) {
    setOrthoPlanError("Please complete patient, treatment type, start date, and adjustment time.");
    return;
  }

  const patientExists = state.patients.some((patient) => patient.name === patientName);
  if (!patientExists) {
    setOrthoPlanError("Please select a patient from the registered patient list.");
    return;
  }

  if (Number.isNaN(months) || Number.isNaN(packageTotal) || Number.isNaN(downpayment)) {
    setOrthoPlanError("Please enter valid numeric values for months and amounts.");
    return;
  }

  if (months < 1) {
    setOrthoPlanError("Duration must be at least 1 month.");
    return;
  }

  if (packageTotal <= 0) {
    setOrthoPlanError("Package total must be greater than 0.");
    return;
  }

  if (downpayment < 0) {
    setOrthoPlanError("Downpayment cannot be negative.");
    return;
  }

  if (downpayment > packageTotal) {
    setOrthoPlanError("Downpayment cannot be greater than package total.");
    return;
  }

  const template = getTreatmentTemplate(treatmentType, months);

  const duplicatePlan = state.plans.find((plan) =>
    plan.planType === treatmentType &&
    String(plan.patient || "").toLowerCase() === patientName.toLowerCase() &&
    plan.startDate === startDate &&
    Number(plan.durationMonths) === template.durationMonths
  );
  if (duplicatePlan) {
    setOrthoPlanError("This treatment plan already exists. Please check Treatment Plans.");
    return;
  }

  const firstAppointmentDate = addMonths(startDate, 0);
  if (!firstAppointmentDate) {
    setOrthoPlanError("Invalid start date.");
    return;
  }

  isCreatingOrthoPlan = true;
  orthoPlanSubmitBtn.disabled = true;
  orthoPlanSubmitBtn.textContent = "Creating...";
  const newPlanId = nextId(state.plans);

  for (let i = 0; i < template.sessions; i += 1) {
    const sessionDate = template.intervalType === "month"
      ? addMonths(startDate, i * template.intervalValue)
      : addDays(startDate, i * template.intervalValue);
    state.appointmentsManager.push({
      id: nextId(state.appointmentsManager),
      patient: patientName,
      date: sessionDate,
      dateLabel: formatDateLabel(sessionDate),
      time: formatTimeLabel(adjustTime),
      dentist: "Dr. Reyes",
      procedure: `${template.label} (${i + 1}/${template.sessions})`,
      status: "pending",
      reminderSent: false,
      followUpForPlanId: newPlanId
    });
  }

  const remaining = packageTotal - downpayment;
  const monthlyTerms = template.sessions;
  const monthlyAmount = remaining > 0 ? remaining / monthlyTerms : 0;
  const invoiceCode = nextInvoiceCode();
  const downpaymentReceipt = downpayment > 0 ? nextReceiptCode() : "";

  state.invoices.push({
    id: nextId(state.invoices),
    code: invoiceCode,
    patient: patientName,
    amount: formatCurrency(packageTotal),
    paid: downpayment >= packageTotal,
    reminded: false,
    paymentType: "installment",
    totalAmount: packageTotal,
    downpayment,
    monthlyTerms,
    monthlyAmount,
    paidAmount: downpayment,
    monthsPaid: 0,
    paymentMethod: "",
    payments: downpayment > 0 ? [{
      date: new Date().toISOString(),
      amount: downpayment,
      method: "Downpayment",
      receipt: downpaymentReceipt
    }] : [],
    lastReceipt: downpaymentReceipt
  });

  state.plans.push({
    id: newPlanId,
    name: `${patientName} - ${getTreatmentDisplayName(treatmentType)} Plan`,
    details: `${template.sessions}-session treatment plan`,
    approved: true,
    patient: patientName,
    startDate,
    durationMonths: template.durationMonths,
    invoiceCode,
    planType: treatmentType,
    sessions: template.sessions,
    estimatedCost: packageTotal,
    executionCount: 0,
    lastExecutionAt: "",
    treatmentNotes: []
  });

  renderAppointmentsManager();
  renderPlans();
  renderInvoices();
  renderPatients();
  refreshDashboard();
  saveState();
  closeOrthoPlanModal();
});

patientForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = patientNameInput.value.trim();
  const contact = patientContactInput.value.trim();
  const email = patientEmailInput.value.trim();
  const address = patientAddressInput.value.trim();
  const medicalHistory = patientHistoryInput.value.trim();
  const birthdate = patientBirthdateInput.value;
  const age = calculateAge(birthdate);

  if (!name || !contact || !email || !address || !medicalHistory || !birthdate || age === "") return;

  state.patients.push({
    id: nextId(state.patients),
    patientCode: nextPatientCode(),
    name,
    contact,
    email,
    address,
    medicalHistory,
    birthdate,
    checkedIn: false,
    exams: [],
    lastPrescription: "",
    lastReport: ""
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
if (!state.inventory.length) {
  loadDentalStarterStock();
  saveState();
}
renderAll();
