function validReg(reg) {
  return /^[0-9]{2}[A-Z]{3}[0-9]{4}$/.test(reg)
}

function validPhone(p) {
  return /^[0-9]{10}$/.test(p)
}

function withinNext30Days(dt) {
  const chosen = new Date(dt)
  const now = new Date()
  const max = new Date()
  max.setDate(now.getDate() + 30)
  return chosen >= now && chosen <= max
}

async function addMember() {
  const name = mname.value.trim()
  const reg = mreg.value.trim()
  const role = mrole.value
  const phone = mcontact.value.trim()

  if (!name || !reg || !role || !phone) {
    alert("Please fill all fields")
    return
  }

  if (!validReg(reg)) {
    alert("Enter a valid registration number in the correct format")
    return
  }

  if (!validPhone(phone)) {
    alert("Phone number must be exactly 10 digits")
    return
  }

  await fetch("/api/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, reg, role, contact: phone })
  })

  clearMemberForm()
  loadMembers()
  loadAttendanceUI()
}

function clearMemberForm() {
  mname.value = ""
  mreg.value = ""
  mrole.value = ""
  mcontact.value = ""
}

async function loadMembers() {
  const members = await (await fetch("/api/members")).json()
  membersEl.innerHTML = ""
  members.forEach(m => {
    const li = document.createElement("li")
    li.innerHTML = `${m.name} (${m.role}) <button onclick="confirmDeleteMember(${m.id})">Remove</button>`
    membersEl.appendChild(li)
  })
}

function confirmDeleteMember(id) {
  if (confirm("Are you sure you want to remove this member?")) deleteMember(id)
}

async function deleteMember(id) {
  await fetch(`/api/members/${id}`, { method: "DELETE" })
  loadMembers()
  loadAttendanceUI()
}

async function addEvent() {
  const name = ename.value.trim()
  const datetime = edatetime.value
  const desc = edesc.value.trim()

  if (!name || !datetime || !desc) {
    alert("Please fill all fields")
    return
  }

  if (!withinNext30Days(datetime)) {
    alert("Event must be scheduled within the next 30 days")
    return
  }

  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, datetime, desc })
  })

  clearEventForm()
  loadEvents()
  loadAttendanceUI()
}

function clearEventForm() {
  ename.value = ""
  edatetime.value = ""
  edesc.value = ""
}

async function loadEvents() {
  const events = await (await fetch("/api/events")).json()
  events.sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
  eventsEl.innerHTML = ""
  events.forEach(e => {
    const li = document.createElement("li")
    li.textContent = `${e.name} - ${new Date(e.datetime).toLocaleString()}`
    eventsEl.appendChild(li)
  })
}

async function loadAttendanceUI() {
  const members = await (await fetch("/api/members")).json()
  const events = await (await fetch("/api/events")).json()

  eventSelect.innerHTML = ""
  events
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .forEach(e => {
      const opt = document.createElement("option")
      opt.value = e.id
      opt.textContent = `${e.name} (${new Date(e.datetime).toLocaleString()})`
      eventSelect.appendChild(opt)
    })

  renderAttendance(members)
  loadSavedAttendance()
}

function renderAttendance(members) {
  attendanceList.innerHTML = ""
  members.forEach(m => {
    const row = document.createElement("div")
    row.innerHTML = `<label><input type="checkbox" data-id="${m.id}"> ${m.name} - ${m.reg}</label>`
    attendanceList.appendChild(row)
  })

  document.querySelectorAll("#attendanceList input").forEach(cb => {
    cb.addEventListener("change", updateStatsLive)
  })
}

async function loadSavedAttendance() {
  const eventId = eventSelect.value
  if (!eventId) return

  const saved = await (await fetch(`/api/attendance/${eventId}`)).json()
  const checks = document.querySelectorAll("#attendanceList input")

  checks.forEach(c => {
    c.checked = !!saved[c.dataset.id]
  })

  updateStatsLive()
}

function updateStatsLive() {
  const checks = document.querySelectorAll("#attendanceList input")
  let present = 0
  checks.forEach(c => {
    if (c.checked) present++
  })

  const total = checks.length
  const absent = total - present
  const percent = total ? Math.round((present / total) * 100) : 0

  attendanceStats.innerHTML = `Total: ${total} | Present: ${present} | Absent: ${absent} | ${percent}% Present`
}

async function saveAttendance() {
  const eventId = eventSelect.value
  if (!eventId) {
    alert("Select an event first")
    return
  }

  const checks = document.querySelectorAll("#attendanceList input")
  const data = {}
  checks.forEach(c => data[c.dataset.id] = c.checked)

  await fetch(`/api/attendance/${eventId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  alert("Attendance saved successfully")
}

const membersEl = document.getElementById("members")
const eventsEl = document.getElementById("events")
const eventSelect = document.getElementById("eventSelect")
const attendanceList = document.getElementById("attendanceList")
const attendanceStats = document.getElementById("attendanceStats")

loadMembers()
loadEvents()
loadAttendanceUI()
