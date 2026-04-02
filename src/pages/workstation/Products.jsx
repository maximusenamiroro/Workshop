import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from("products")                    // ← Your products table
        .select("*")
        .eq("worker_id", user.id)            // Only this worker's products
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Refresh the list
      loadProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading your products...</div>;
  }

  return (
    <div style={{ padding: 20, background: "#0f172a", minHeight: "100vh", color: "white" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Your Work Posts</h2>
        <button
          onClick={() => navigate("/workstation/upload")}
          style={{
            padding: "10px 20px",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Upload New Work
        </button>
      </div>

      {products.length === 0 ? (
        <p>No work uploaded yet</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                border: "1px solid #334155",
                padding: 15,
                borderRadius: 12,
                background: "#1e293b"
              }}
            >
              {product.preview && (
                <img
                  src={product.preview}
                  alt={product.title}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 12
                  }}
                />
              )}

              <h3 style={{ margin: "0 0 8px 0" }}>{product.title}</h3>
              <p style={{ color: "#94a3b8", margin: "4px 0" }}>{product.category}</p>
              <p style={{ color: "#22c55e", fontWeight: "bold" }}>
                ₦{Number(product.price).toLocaleString()}
              </p>

              <button
                onClick={() => deleteProduct(product.id)}
                style={{
                  marginTop: 12,
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;