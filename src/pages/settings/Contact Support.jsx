import { useState } from "react";

export default function ContactSupport(){

const [message,setMessage] = useState("");

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Contact Support
</h2>

<p className="text-sm text-gray-500 mb-3">
Our support team will respond as soon as possible.
</p>

<textarea
placeholder="Type your message"
value={message}
onChange={(e)=>setMessage(e.target.value)}
className="w-full border p-2 rounded mb-4"
/>

<button className="w-full bg-black text-white py-2 rounded">
Send Message
</button>

</div>

);
}
