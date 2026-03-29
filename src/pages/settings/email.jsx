import { useState } from "react";

export default function EmailAddress() {

const [email,setEmail] = useState("");

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">Email Address</h2>

<label className="text-sm text-gray-600">
New Email Address
</label>

<input
type="email"
placeholder="Enter new email"
className="w-full border p-2 rounded mt-1 mb-3"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<p className="text-xs text-gray-500">
We will send a verification email to confirm this address.
</p>

<button className="w-full bg-black text-white py-2 rounded mt-4">
Send Verification Email
</button>

</div>

);
}
