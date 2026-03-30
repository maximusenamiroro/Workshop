import { useEffect, useState } from "react"
import BottomNav from "../components/BottomNav"

function Tracking() {

  const [trackingJobs, setTrackingJobs] = useState([])

  useEffect(() => {
    loadTracking()
  }, [])

  const loadTracking = () => {
    const storedTracking =
      JSON.parse(localStorage.getItem("tracking")) || []

    setTrackingJobs(storedTracking)
  }

  // START TRACKING

  const startTracking = (job) => {

    const updated = trackingJobs.map((t) => {

      if (t.id === job.id) {
        return {
          ...t,
          trackingStatus: "Waiting for Client",
          distance: "0 km"
        }
      }

      return t
    })

    localStorage.setItem(
      "tracking",
      JSON.stringify(updated)
    )

    setTrackingJobs(updated)
  }

  // ACTIVATE TRACKING (client will approve later)

  const activateTracking = (job) => {

    const updated = trackingJobs.map((t) => {

      if (t.id === job.id) {
        return {
          ...t,
          trackingStatus: "Active",
          distance: "2.3 km"
        }
      }

      return t
    })

    localStorage.setItem(
      "tracking",
      JSON.stringify(updated)
    )

    setTrackingJobs(updated)
  }

  // COMPLETE JOB

  const completeJob = (job) => {

    const remaining =
      trackingJobs.filter(t => t.id !== job.id)

    localStorage.setItem(
      "tracking",
      JSON.stringify(remaining)
    )

    const activity =
      JSON.parse(localStorage.getItem("activity")) || []

    const completedJob = {
      ...job,
      status: "Completed",
      completedAt: new Date().toISOString()
    }

    localStorage.setItem(
      "activity",
      JSON.stringify([...activity, completedJob])
    )

    setTrackingJobs(remaining)
  }

  return (
    <div style={container}>

      <h2>Tracking</h2>

      <p style={subtitle}>
        Manage scheduled jobs and tracking
      </p>

      {trackingJobs.length === 0 && (
        <p>No scheduled jobs</p>
      )}

      {trackingJobs.map(job => (

        <div key={job.id} style={card}>

          <h3>{job.title}</h3>

          <p>{job.description}</p>

          <p>₦{job.price}</p>

          <p style={location}>
            📍 {job.location}
          </p>

          <p style={status}>
            Status: {job.trackingStatus}
          </p>

          {job.distance && (
            <p style={distance}>
              Distance: {job.distance}
            </p>
          )}

          <div style={actions}>

            {job.trackingStatus === "Not Started" && (

              <button
                style={startBtn}
                onClick={() => startTracking(job)}
              >
                Start Tracking
              </button>

            )}

            {job.trackingStatus === "Waiting for Client" && (

              <button
                style={waitingBtn}
              >
                Waiting for Client
              </button>

            )}

            {job.trackingStatus === "Active" && (

              <button
                style={completeBtn}
                onClick={() => completeJob(job)}
              >
                Complete Job
              </button>

            )}

          </div>

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
  color: "#22c55e",
  marginTop: 5
}

const distance = {
  color: "#facc15"
}

const actions = {
  marginTop: 10
}

const startBtn = {
  width: "100%",
  padding: 10,
  background: "green",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
}

const waitingBtn = {
  width: "100%",
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white"
}

const completeBtn = {
  width: "100%",
  padding: 10,
  background: "#22c55e",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
}

export default Tracking
