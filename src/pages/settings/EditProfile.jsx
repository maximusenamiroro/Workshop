import { useState } from "react";

export default function EditProfile() {

const [profile,setProfile] = useState({
sellerName:"",
country:"",
bio:""
});

const countries = [
"Nigeria","United States","United Kingdom","Canada","Germany","France","Spain",
"Italy","Netherlands","Belgium","Sweden","Norway","Denmark","Finland",
"Poland","Portugal","Switzerland","Austria","Ireland","Greece",
"Turkey","Russia","Ukraine","Romania","Bulgaria","Hungary",
"China","Japan","South Korea","India","Pakistan","Bangladesh",
"Indonesia","Malaysia","Singapore","Thailand","Vietnam","Philippines",
"Australia","New Zealand",
"South Africa","Kenya","Ghana","Egypt","Morocco","Algeria","Tunisia",
"Brazil","Argentina","Chile","Colombia","Mexico","Peru",
"Saudi Arabia","United Arab Emirates","Qatar","Kuwait","Oman","Israel"
];

const handleChange = (e)=>{
setProfile({...profile,[e.target.name]:e.target.value});
};

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">Edit Profile</h2>

{/* Profile Image */}

<div className="flex flex-col items-center mb-5">

<img
src="https://via.placeholder.com/120"
className="w-28 h-28 rounded-full object-cover mb-2"
/>

<button className="text-blue-500 text-sm">
Change Photo
</button>

</div>

{/* Seller Name */}

<label className="text-sm text-gray-600">Seller Name</label>

<input
name="sellerName"
placeholder="Enter seller name"
className="w-full border p-2 rounded mb-4"
onChange={handleChange}
/>

{/* Country */}

<label className="text-sm text-gray-600">Country</label>

<select
name="country"
className="w-full border p-2 rounded mb-4"
onChange={handleChange}
>

<option value="">Select Country</option>

{countries.map((country,index)=>(
<option key={index} value={country}>
{country}
</option>
))}

</select>

{/* Bio */}

<label className="text-sm text-gray-600">Bio</label>

<textarea
name="bio"
placeholder="Tell customers about your omoworkit"
className="w-full border p-2 rounded mb-5"
onChange={handleChange}
/>

{/* Save */}

<button className="w-full bg-black text-white py-2 rounded">
Save Changes
</button>

</div>

);
}
