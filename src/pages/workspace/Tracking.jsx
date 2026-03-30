import { useEffect, useState } from "react"
import BottomNav from "../components/BottomNav"

function wspTracking() {

  const [tracking, setTracking] = useState([])

  useEffect(() => {
    loadTracking()
    startDistanceUpdate()
  }, [])

  const loadTracking = () => {

    const stored =
      JSON.parse(localStorage.getItem("tracking")) || []

    setTracking(stored)
  }

  // live kilometer tracking

  const startDistanceUpdate = () => {

    setInterval(() => {

      const stored =
        JSON.parse(localStorage.getItem("tracking")) || []

      const updated = stored.map(job => {

        if (job.trackingStatus === "Active") {

          let distance =
            parseFloat(job.distance || "0")

          distance += 0.3

          return {
            ...job,
            distance: distance.toFixed(1) + " km"
          }
        }

        return job
      })

      localStorage.setItem(
        "tracking",
        JSON.stringify(updated)
      )

      setTracking(updated)

    }, 4000)

  }

  return (
    <div style={container}>

      <h2>Tracking</h2>

      <p style={subtitle}>
        Monitor worker distance and job progress
      </p>

      {tracking.length === 0 && (
        <p>No active tracking</p>
      )}

      {tracking.map(job => (

        <div key={job.id} style={card}>

          <h3>{job.title}</h3>

          <p>{job.description}</p>

          <p>₦{job.price}</p>

          <p>📍 {job.location}</p>

          <p style={status}>
            Status: {job.trackingStatus}
          </p>

          {job.distance && (
            <p style={distance}>
              Distance Covered: {job.distance}
            </p>
          )}

          {job.trackingStatus === "Active" && (
            <div style={live}>
              ● Live Kilometer Tracking
            </div>
          )}

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

const status = {
  color: "#22c55e"
}

const distance = {
  color: "#facc15",
  fontWeight: "bold",
  marginTop: 5
}

const live = {
  marginTop: 10,
  color: "#22c55e",
  fontWeight: "bold"
}

export default Tracking
