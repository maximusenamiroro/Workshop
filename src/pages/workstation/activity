import { useEffect, useState } from "react"
import BottomNav from "../components/BottomNav"

function Activity() {

  const [activity, setActivity] = useState([])

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = () => {

    const storedActivity =
      JSON.parse(localStorage.getItem("activity")) || []

    setActivity(storedActivity)
  }

  return (
    <div style={container}>

      <h2>Activity</h2>

      <p style={subtitle}>
        Completed jobs and history
      </p>

      {activity.length === 0 && (
        <p>No completed jobs yet</p>
      )}

      {activity.map(job => (

        <div key={job.id} style={card}>

          <h3>{job.title}</h3>

          <p>{job.description}</p>

          <p>₦{job.price}</p>

          <p style={location}>
            📍 {job.location}
          </p>

          <p style={status}>
            Status: Completed
          </p>

          {job.distance && (
            <p style={distance}>
              Distance: {job.distance}
            </p>
          )}

          <p style={time}>
            Completed: {new Date(job.completedAt)
              .toLocaleString()}
          </p>

        </div>

      ))}

      <BottomNav />

    </div>
  )
}

const container = {
  background: "#0f172a",
  minHeight: "100vh",
  color: "white",
  padding: 20,
  paddingBottom: 80
}

const subtitle = {
  color: "#94a3b8",
  marginBottom: 20
}

const card = {
  background: "#1e293b",
  padding: 15,
  borderRadius: 15,
  marginTop: 10
}

const location = {
  color: "#94a3b8"
}

const status = {
  color: "#22c55e"
}

const distance = {
  color: "#facc15"
}

const time = {
  color: "#94a3b8",
  marginTop: 5
}

export default Activity
