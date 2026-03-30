import { useState } from "react"
import { useNavigate } from "react-router-dom"

function UploadWork() {

  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)

  const handleMedia = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)

    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title || !description || !price || !category || !location) {
      alert("Please fill all fields")
      return
    }

    const newProduct = {
      id: Date.now(),
      title,
      description,
      price,
      category,
      location,
      preview,
      createdAt: new Date().toISOString()
    }

    const existingProducts =
      JSON.parse(localStorage.getItem("products")) || []

    localStorage.setItem(
      "products",
      JSON.stringify([...existingProducts, newProduct])
    )

    alert("Work uploaded successfully")

    navigate("/workstation/products")
  }

  return (
    <div style={container}>

      <h2 style={titleStyle}>Upload Work</h2>
      <p style={subtitle}>
        Post your service so clients can find you
      </p>

      <div style={card}>

        <form onSubmit={handleSubmit}>

          {/* Title */}

          <input
            type="text"
            placeholder="Service Title"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            style={input}
          />

          {/* Description */}

          <textarea
            placeholder="Service Description"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            style={input}
          />

          {/* Price */}

          <input
            type="number"
            placeholder="Price (₦)"
            value={price}
            onChange={(e)=>setPrice(e.target.value)}
            style={input}
          />

          {/* Category */}

          <select
            value={category}
            onChange={(e)=>setCategory(e.target.value)}
            style={input}
          >
            <option value="">Select Category</option>
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>Painting</option>
            <option>Cleaning</option>
            <option>Mechanic</option>
            <option>Carpentry</option>
            <option>Fashion</option>
            <option>Tech Repair</option>
          </select>

          {/* Location */}

          <input
            type="text"
            placeholder="Location (Abuja, Lagos, PH, Delta)"
            value={location}
            onChange={(e)=>setLocation(e.target.value)}
            style={input}
          />

          {/* Upload */}

          <input
            type="file"
            onChange={handleMedia}
            style={{ marginTop: 10, color: "white" }}
          />

          {/* Preview */}

          {preview && (
            <img
              src={preview}
              alt="preview"
              style={previewImage}
            />
          )}

          {/* Button */}

          <button style={button}>
            Upload Work
          </button>

        </form>

      </div>

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

const titleStyle = {
  fontSize: 22,
  fontWeight: "bold"
}

const subtitle = {
  color: "#94a3b8",
  marginTop: 5
}

const card = {
  background: "#1e293b",
  padding: 20,
  borderRadius: 15,
  marginTop: 20
}

const input = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  borderRadius: 10,
  border: "none",
  outline: "none"
}

const previewImage = {
  width: "100%",
  marginTop: 10,
  borderRadius: 10
}

const button = {
  width: "100%",
  padding: 12,
  marginTop: 15,
  background: "green",
  border: "none",
  borderRadius: 10,
  color: "white",
  fontWeight: "bold",
  cursor: "pointer"
}

function BottomNav() {

  const navigate = useNavigate()

  return (
    <div style={nav}>

      <button onClick={()=>navigate("/workstation")}>
        Home
      </button>

      <button onClick={()=>navigate("/workstation/products")}>
        Posts
      </button>

      <button onClick={()=>navigate("/workstation/bookings")}>
        Bookings
      </button>

      <button onClick={()=>navigate("/workstation/live")}>
        Live
      </button>

      <button onClick={()=>navigate("/workstation/tracking")}>
        Tracking
      </button>

    </div>
  )
}

const nav = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "#1e293b",
  padding: 10,
  display: "flex",
  justifyContent: "space-around"
}

export default UploadWork
