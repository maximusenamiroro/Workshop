import { useEffect, useState } from "react"

export default function LiveService() {

  const [liveServices, setLiveServices] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {

    const data =
      JSON.parse(localStorage.getItem("liveServices")) || []

    setLiveServices(data)

  }, [])

  // search filter
  const filtered = liveServices.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.service.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  // groupings
  const bookWorkers = filtered.filter(
    item =>
      item.type === "worker" &&
      item.handSkill === true &&
      item.isLive
  )

  const hireWorkers = filtered.filter(
    item =>
      item.type === "worker" &&
      item.handSkill === false &&
      item.isLive
  )

  const orderProducts = filtered.filter(
    item =>
      item.type === "product" &&
      item.isLive
  )

  const nearbyWorkers = filtered.filter(
    item => item.type === "worker" && !item.isLive
  )

  return (
    <div className="bg-[#0B0F19] min-h-screen p-4">

      {/* Title */}
      <h1 className="text-white text-xl font-semibold mb-4">
        Live Services
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search workers or products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 rounded-lg bg-[#111827] text-white mb-4"
      />

      {/* Live Indicator */}
      <div className="bg-[#111827] text-green-400 px-4 py-2 rounded-lg mb-5 text-sm">
        ● Broadcasting Live Services Nearby
      </div>

      {/* Book Workers */}
      {bookWorkers.length > 0 && (
        <div className="mb-6">

          <h2 className="text-white text-lg font-semibold mb-3">
            Book Workers
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {bookWorkers.map(worker => (
              <div
                key={worker.id}
                className="bg-[#111827] p-4 rounded-lg text-white"
              >
                <h3 className="font-semibold">
                  {worker.name}
                </h3>

                <p className="text-sm text-gray-400">
                  {worker.service}
                </p>

                <p className="text-sm">
                  {worker.location}
                </p>

                <button className="mt-3 bg-blue-600 px-3 py-1 rounded">
                  Book
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Hire Workers */}
      {hireWorkers.length > 0 && (
        <div className="mb-6">

          <h2 className="text-white text-lg font-semibold mb-3">
            Hire Workers
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {hireWorkers.map(worker => (
              <div
                key={worker.id}
                className="bg-[#111827] p-4 rounded-lg text-white"
              >
                <h3 className="font-semibold">
                  {worker.name}
                </h3>

                <p className="text-sm text-gray-400">
                  {worker.service}
                </p>

                <p className="text-sm">
                  {worker.location}
                </p>

                <button className="mt-3 bg-green-600 px-3 py-1 rounded">
                  Hire
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Order Products */}
      {orderProducts.length > 0 && (
        <div className="mb-6">

          <h2 className="text-white text-lg font-semibold mb-3">
            Order Products
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {orderProducts.map(product => (
              <div
                key={product.id}
                className="bg-[#111827] p-4 rounded-lg text-white"
              >
                <h3 className="font-semibold">
                  {product.service}
                </h3>

                <p className="text-sm text-gray-400">
                  {product.category}
                </p>

                <p className="text-sm">
                  {product.location}
                </p>

                <p className="text-blue-400">
                  ₦{product.price}
                </p>

                <button className="mt-3 bg-purple-600 px-3 py-1 rounded">
                  Order
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Nearby Workers */}
      {nearbyWorkers.length > 0 && (
        <div className="mb-6">

          <h2 className="text-white text-lg font-semibold mb-3">
            Nearby Workers
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {nearbyWorkers.map(worker => (
              <div
                key={worker.id}
                className="bg-[#111827] p-4 rounded-lg text-white"
              >
                <h3 className="font-semibold">
                  {worker.name}
                </h3>

                <p className="text-sm text-gray-400">
                  {worker.service}
                </p>

                <p className="text-sm">
                  {worker.location}
                </p>

                <span className="text-gray-500 text-xs">
                  Offline
                </span>
              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  )
}
