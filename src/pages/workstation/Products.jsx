import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Products() {

  const [products, setProducts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const storedProducts =
      JSON.parse(localStorage.getItem("products")) || []

    setProducts(storedProducts)
  }, [])

  const deleteProduct = (id) => {

    const updatedProducts = products.filter(
      (product) => product.id !== id
    )

    setProducts(updatedProducts)

    localStorage.setItem(
      "products",
      JSON.stringify(updatedProducts)
    )
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>Your Work Posts</h2>

      <button
        onClick={() =>
          navigate("/workstation/upload")
        }
      >
        Upload New Work
      </button>

      <br /><br />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px"
        }}
      >

        {products.length === 0 && (
          <p>No work uploaded yet</p>
        )}

        {products.map((product) => (

          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              padding: 15,
              borderRadius: 10,
              background: "#fff"
            }}
          >

            <img
              src={product.preview}
              alt={product.title}
              style={{
                width: "100%",
                height: 150,
                objectFit: "cover",
                borderRadius: 10
              }}
            />

            <h3>{product.title}</h3>

            <p>{product.category}</p>

            <p>₦{product.price}</p>

            <button
              onClick={() => deleteProduct(product.id)}
            >
              Delete
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}

export default Products
