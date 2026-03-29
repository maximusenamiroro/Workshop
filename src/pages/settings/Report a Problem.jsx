import { useState } from "react";

export default function ReportProblem(){

const [message,setMessage] = useState("");

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Report a Problem
</h2>

<select className="w-full border p-2 rounded mb-3">

<option>Select issue</option>
<option>Login problem</option>
<option>Payment problem</option>
<option>Product upload issue</option>
<option>App bug</option>

</select>

<textarea
placeholder="Describe the problem"
value={message}
onChange={(e)=>setMessage(e.target.value)}
className="w-full border p-2 rounded mb-4"
/>

<input type="file" className="mb-4"/>

<button className="w-full bg-black text-white py-2 rounded">
Submit Report
</button>

</div>

);
}
