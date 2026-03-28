import { useState } from "react";

export default function ChangePassword() {

const [form, setForm] = useState({
current:"",
new:"",
confirm:""
});

const handleChange = (e)=>{
setForm({...form,[e.target.name]:e.target.value});
};

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">Change Password</h2>

<input
type="password"
name="current"
placeholder="Current Password"
className="w-full border p-2 rounded mb-3"
onChange={handleChange}
/>

<input
type="password"
name="new"
placeholder="New Password"
className="w-full border p-2 rounded mb-3"
onChange={handleChange}
/>

<input
type="password"
name="confirm"
placeholder="Confirm New Password"
className="w-full border p-2 rounded mb-3"
onChange={handleChange}
/>

<p className="text-sm text-gray-500 mb-4">
Password must be at least 8 characters.
</p>

<button className="w-full bg-black text-white py-2 rounded">
Update Password
</button>

</div>

);
}