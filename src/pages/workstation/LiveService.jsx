import { useEffect, useState } from "react"

function LiveService() {

  const [isLive, setIsLive] = useState(false)
  const [service, setService] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState("offline")

  useEffect(() => {

    const liveData =
      JSON.parse(localStorage.getItem("liveService"))

    if (liveData) {
      setIsLive(liveData.isLive)
      setService(liveData.service)
      setLocation(liveData.location)
      setStatus(liveData.status)
    }

  }, [])

  const toggleLive = () => {

    const newStatus = !isLive

    setIsLive(newStatus)

    const liveInfo = {
      isLive: newStatus,
      service,
      location,
      status: newStatus ? "online" : "offline"
    }

    setStatus(liveInfo.status)

    localStorage.setItem(
      "liveService",
      JSON.stringify(liveInfo)
    )
  }

  const updateService = () => {

    const liveInfo = {
      isLive,
      service,
      location,
      status
    }

    localStorage.setItem(
      "liveService",
      JSON.stringify(liveInfo)
    )

    alert("Live service updated")
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>Live Service Mode</h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 10,
          background: "#fff",
          maxWidth: 400
        }}
      >

        <h3>Status: {status}</h3>

        <br />

        <label>Service Type</label>

        <input
          placeholder="e.g House Cleaning"
          value={service}
          onChange={(e) =>
            setService(e.target.value)
          }
        />

        <br /><br />

        <label>Location</label>

        <input
          placeholder="e.g Abuja"
          value={location}
          onChange={(e) =>
            setLocation(e.target.value)
          }
        />

        <br /><br />

        <button onClick={updateService}>
          Update Service
        </button>

        <br /><br />

        <button
          onClick={toggleLive}
          style={{
            background: isLive ? "red" : "green",
            color: "white",
            padding: 10,
            border: "none",
            borderRadius: 5
          }}
        >
          {isLive ? "Stop Live Service" : "Start Live Service"}
        </button>

      </div>

    </div>
  )
}

export default LiveService
