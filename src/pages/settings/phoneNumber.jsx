import { useState } from "react";

export default function PhoneNumber() {

const [phone,setPhone] = useState("");

return (

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">Phone Number</h2>

<label className="text-sm text-gray-600">
New Phone Number
</label>

<div className="flex gap-2 mt-1">

<select className="border rounded p-2">
<option>+234</option>
<option>+1</option>
<option>+44</option>
</select>

<input
type="tel"
placeholder="Enter phone number"
className="flex-1 border p-2 rounded"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

</div>

<p className="text-xs text-gray-500 mt-2">
We will send a verification code to confirm this number.
</p>

<button className="w-full bg-black text-white py-2 rounded mt-4">
Send Verification Code
</button>

</div>

);

}
