import { useEffect, useState } from "react"


function Bookings() {

  const [bookings, setBookings] = useState([])

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {

    const storedBookings =
      JSON.parse(localStorage.getItem("bookings")) || []

    setBookings(storedBookings)
  }

  // CLIENT APPROVES TRACKING

  const approveTracking = (job) => {

    const tracking =
      JSON.parse(localStorage.getItem("tracking")) || []

    const updatedTracking = tracking.map((t) => {

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
      JSON.stringify(updatedTracking)
    )

    alert("Tracking Activated")

    loadBookings()
  }

  return (
    <div style={container}>

      <h2>Bookings</h2>

      <p style={subtitle}>
        Approve worker tracking and monitor jobs
      </p>

      {bookings.length === 0 && (
        <p>No bookings yet</p>
      )}

      {bookings.map(job => {

        const tracking =
          JSON.parse(localStorage.getItem("tracking")) || []

        const trackingJob =
          tracking.find(t => t.id === job.id)

        return (

          <div key={job.id} style={card}>

            <h3>{job.title}</h3>

            <p>{job.description}</p>

            <p>₦{job.price}</p>

            <p style={location}>
              📍 {job.location}
            </p>

            <p style={status}>
              Status: {job.status}
            </p>

            {trackingJob && (
              <p style={trackingStatus}>
                Tracking: {trackingJob.trackingStatus}
              </p>
            )}

            <div style={actions}>

              {trackingJob &&
               trackingJob.trackingStatus ===
               "Waiting for Client" && (

                <button
                  style={approveBtn}
                  onClick={() =>
                    approveTracking(job)
                  }
                >
                  Approve Tracking
                </button>

              )}

              {trackingJob &&
               trackingJob.trackingStatus ===
               "Active" && (

                <button style={activeBtn}>
                  Tracking Active
                </button>

              )}

            </div>

          </div>

        )
      })}

  

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

const trackingStatus = {
  color: "#facc15",
  marginTop: 5
}

const actions = {
  marginTop: 10
}

const approveBtn = {
  width: "100%",
  padding: 10,
  background: "#22c55e",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
}

const activeBtn = {
  width: "100%",
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white"
}

export default Bookings
