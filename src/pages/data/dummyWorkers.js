
const workersDummy = [

  // BOOKING WORKERS (Handskill - can be booked)

  {
    id: "wk1",
    name: "John Electric",
    category: "handskill",
    serviceType: "booking",
    skill: "Electrician",
    location: "Lagos",
    price: 15000,
    rating: 4.5,
    availability: true,
    image: "/workers/electrician.jpg",
    description: "Professional electrician for home and office wiring"
  },

  {
    id: "wk2",
    name: "Mike Plumber",
    category: "handskill",
    serviceType: "booking",
    skill: "Plumber",
    location: "Lagos",
    price: 12000,
    rating: 4.3,
    availability: true,
    image: "/workers/plumber.jpg",
    description: "Expert in water system and pipe installation"
  },

  {
    id: "wk3",
    name: "David Carpenter",
    category: "handskill",
    serviceType: "booking",
    skill: "Carpenter",
    location: "Abuja",
    price: 18000,
    rating: 4.7,
    availability: true,
    image: "/workers/carpenter.jpg",
    description: "Furniture and woodwork specialist"
  },



  // PRODUCT ORDER WORKERS (Sell products)

  {
    id: "wk4",
    name: "Bright Furniture",
    category: "product",
    serviceType: "order",
    skill: "Furniture Maker",
    location: "Lagos",
    price: 50000,
    rating: 4.6,
    availability: true,
    image: "/workers/furniture.jpg",
    description: "Quality furniture and wood products"
  },

  {
    id: "wk5",
    name: "Steel Fabricator",
    category: "product",
    serviceType: "order",
    skill: "Metal Works",
    location: "Port Harcourt",
    price: 70000,
    rating: 4.4,
    availability: true,
    image: "/workers/metal.jpg",
    description: "Metal doors, gates, and fabrication"
  },



  // HIRING WORKERS (Non-hand skill workers)

  {
    id: "wk6",
    name: "Office Assistant",
    category: "non-handskill",
    serviceType: "hire",
    skill: "Assistant",
    location: "Lagos",
    price: 80000,
    rating: 4.2,
    availability: true,
    image: "/workers/assistant.jpg",
    description: "Reliable office assistant for daily tasks"
  },

  {
    id: "wk7",
    name: "Security Guard",
    category: "non-handskill",
    serviceType: "hire",
    skill: "Security",
    location: "Abuja",
    price: 90000,
    rating: 4.1,
    availability: true,
    image: "/workers/security.jpg",
    description: "Professional security personnel"
  }

];

export default workersDummy;
// import React from 'react'

// export default function dummyWorkers() {
//   return (
//     <div>
//       df
//     </div>
//   )
// }

