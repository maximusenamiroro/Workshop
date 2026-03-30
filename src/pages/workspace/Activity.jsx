import { useEffect, useState } from "react"


function Activity() {

  const [activity, setActivity] = useState([])

  useEffect(() => {
    loadActivity()
  }, [])

  const loadActivity = () => {

    const stored =
      JSON.parse(localStorage.getItem("activity")) || []

    setActivity(stored)
  }

  return (
    <div style={container}>

      <h2>Activity</h2>

      <p style={subtitle}>
        Completed services and job history
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
            Completed
          </p>

          {job.distance && (
            <p style={distance}>
              Distance Covered: {job.distance}
            </p>
          )}

          <p style={time}>
            {new Date(job.completedAt).toLocaleString()}
          </p>

        </div>

      ))}

   

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
  color: "#facc15",
  marginTop: 5
}

const time = {
  color: "#94a3b8",
  marginTop: 5
}

export default Activity
