import { useEffect, useState } from "react"
import BottomNav from "../components/BottomNav"

function Bookings() {

  const [groupedBookings, setGroupedBookings] = useState({})

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = () => {

    const storedBookings =
      JSON.parse(localStorage.getItem("bookings")) || []

    const grouped = {}

    storedBookings.forEach((booking) => {

      const category =
        booking.category || "For Hire"

      if (!grouped[category]) {
        grouped[category] = []
      }

      grouped[category].push(booking)
    })

    setGroupedBookings(grouped)
  }

  // ACCEPT BOOKING

  const acceptBooking = (booking) => {

    const allBookings =
      JSON.parse(localStorage.getItem("bookings")) || []

    const updatedBookings =
      allBookings.filter(b => b.id !== booking.id)

    localStorage.setItem(
      "bookings",
      JSON.stringify(updatedBookings)
    )

    const trackingList =
      JSON.parse(localStorage.getItem("tracking")) || []

    const scheduledBooking = {
      ...booking,
      status: "Scheduled",
      trackingStatus: "Not Started"
    }

    localStorage.setItem(
      "tracking",
      JSON.stringify([...trackingList, scheduledBooking])
    )

    loadBookings()
  }

  // DECLINE BOOKING

  const declineBooking = (booking) => {

    const allBookings =
      JSON.parse(localStorage.getItem("bookings")) || []

    const updatedBookings =
      allBookings.filter(b => b.id !== booking.id)

    localStorage.setItem(
      "bookings",
      JSON.stringify(updatedBookings)
    )

    loadBookings()
  }

  return (
    <div style={container}>

      <h2>Client Bookings</h2>

      <p style={subtitle}>
        Organized by category
      </p>

      {Object.keys(groupedBookings).length === 0 && (
        <p>No bookings yet</p>
      )}

      {Object.keys(groupedBookings).map(category => (

        <div key={category}>

          <h3 style={categoryTitle}>
            {category}
          </h3>

          {groupedBookings[category].map((booking) => (

            <div key={booking.id} style={card}>

              <h4>{booking.title}</h4>

              <p>{booking.description}</p>

              <p>₦{booking.price}</p>

              <p style={location}>
                📍 {booking.location}
              </p>

              <p style={status}>
                Status: Pending
              </p>

              <div style={actions}>

                <button
                  style={acceptBtn}
                  onClick={() => acceptBooking(booking)}
                >
                  Accept
                </button>

                <button
                  style={declineBtn}
                  onClick={() => declineBooking(booking)}
                >
                  Decline
                </button>

              </div>

            </div>

          ))}

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

const categoryTitle = {
  marginTop: 20,
  fontSize: 18,
  fontWeight: "bold",
  color: "#22c55e"
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
  color: "#facc15",
  marginTop: 5
}

const actions = {
  display: "flex",
  gap: 10,
  marginTop: 10
}

const acceptBtn = {
  flex: 1,
  padding: 10,
  background: "green",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
}

const declineBtn = {
  flex: 1,
  padding: 10,
  background: "#334155",
  border: "none",
  borderRadius: 8,
  color: "white",
  cursor: "pointer"
}

export default Bookings
