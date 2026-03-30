import { useEffect, useState } from "react"

function LiveService() {

  const [isLive, setIsLive] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("worker")
  const [service, setService] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [handSkill, setHandSkill] = useState(true)
  const [price, setPrice] = useState("")
  const [status, setStatus] = useState("offline")

  useEffect(() => {

    const liveData =
      JSON.parse(localStorage.getItem("liveServices")) || []

    if (liveData.length > 0) {
      const last = liveData[liveData.length - 1]

      setIsLive(last.isLive)
      setName(last.name)
      setType(last.type)
      setService(last.service)
      setCategory(last.category)
      setLocation(last.location)
      setHandSkill(last.handSkill)
      setPrice(last.price)
      setStatus(last.status)
    }

  }, [])

  const toggleLive = () => {

    if (!name || !service || !location) {
      alert("Please fill all required fields")
      return
    }

    const newStatus = !isLive

    const liveInfo = {
      id: Date.now(),
      name,
      type, // worker or product
      service,
      category,
      location,
      handSkill: type === "worker" ? handSkill : null,
      price,
      isLive: newStatus,
      status: newStatus ? "online" : "offline",
      createdAt: new Date().toISOString()
    }

    setIsLive(newStatus)
    setStatus(liveInfo.status)

    const existing =
      JSON.parse(localStorage.getItem("liveServices")) || []

    if (newStatus) {

      const updated = [
        ...existing.filter(item => item.id !== liveInfo.id),
        liveInfo
      ]

      localStorage.setItem(
        "liveServices",
        JSON.stringify(updated)
      )

    } else {

      const updated =
        existing.filter(item => item.name !== name)

      localStorage.setItem(
        "liveServices",
        JSON.stringify(updated)
      )
    }
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
          maxWidth: 420
        }}
      >

        <h3>Status: {status}</h3>

        <br />

        <label>Name</label>
        <input
          placeholder="John Cleaner or Gas Supplier"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <br /><br />

        <label>Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="worker">Worker</option>
          <option value="product">Product</option>
        </select>

        <br /><br />

        <label>Service / Product</label>
        <input
          placeholder="House Cleaning or Gas Cylinder"
          value={service}
          onChange={(e) => setService(e.target.value)}
        />

        <br /><br />

        <label>Category</label>
        <input
          placeholder="Cleaning, Mechanical, Home, Fashion"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <br /><br />

        <label>Location</label>
        <input
          placeholder="Lagos"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <br /><br />

        {type === "worker" && (
          <>
            <label>Service Group</label>

            <select
              value={handSkill}
              onChange={(e) =>
                setHandSkill(e.target.value === "true")
              }
            >
              <option value="true">
                Hand Skill (Book Worker)
              </option>

              <option value="false">
                Non Hand Skill (Hire Worker)
              </option>
            </select>

            <br /><br />
          </>
        )}

        {type === "product" && (
          <>
            <label>Price</label>

            <input
              placeholder="25000"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
            />

            <br /><br />
          </>
        )}

        <button
          onClick={toggleLive}
          style={{
            background: isLive ? "red" : "green",
            color: "white",
            padding: 12,
            border: "none",
            borderRadius: 6,
            width: "100%"
          }}
        >
          {isLive
            ? "Stop Live Service"
            : "Start Live Service"}
        </button>

      </div>

    </div>
  )
}

export default LiveService
