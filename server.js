const express = require("express")
const fs = require("fs")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static("public"))

const membersFile = path.join(__dirname, "data/members.json")
const eventsFile = path.join(__dirname, "data/events.json")
const attendanceFile = path.join(__dirname, "data/attendance.json")

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

app.get("/api/members", (req, res) => {
  res.json(read(membersFile))
})

app.post("/api/members", (req, res) => {
  const members = read(membersFile)
  members.push({ id: Date.now(), ...req.body })
  write(membersFile, members)
  res.json(members)
})

app.delete("/api/members/:id", (req, res) => {
  let members = read(membersFile)
  members = members.filter(m => m.id != req.params.id)
  write(membersFile, members)
  res.json(members)
})

app.get("/api/events", (req, res) => {
  res.json(read(eventsFile))
})

app.post("/api/events", (req, res) => {
  const events = read(eventsFile)
  events.push({ id: Date.now(), ...req.body })
  write(eventsFile, events)
  res.json(events)
})

app.post("/api/attendance/:eventId", (req, res) => {
  const attendance = read(attendanceFile)
  attendance[req.params.eventId] = req.body
  write(attendanceFile, attendance)
  res.json(attendance)
})

app.get("/api/attendance/:eventId", (req, res) => {
  const attendance = read(attendanceFile)
  res.json(attendance[req.params.eventId] || {})
})

app.listen(PORT)
