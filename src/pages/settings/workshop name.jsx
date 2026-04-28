import { useState } from "react";

export default function omoworkitName() {

const [name,setName] = useState("");

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">omoworkit Name</h2>

<p className="text-sm text-gray-500 mb-3">
This name will appear on your omoworkit profile.
</p>

<input
type="text"
placeholder="Enter omoworkit name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full border p-2 rounded mb-4"
/>

<button className="w-full bg-black text-white py-2 rounded">
Save
</button>

</div>

);
}
