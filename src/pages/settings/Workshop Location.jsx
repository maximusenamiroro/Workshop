import { useState } from "react";

export default function WorkshopLocation(){

const [location,setLocation] = useState({
country:"",
city:"",
address:""
});

const countries = [
"Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
"Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados",
"Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina",
"Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
"Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad",
"Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba",
"Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic",
"Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia",
"Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia",
"Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
"Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran",
"Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
"Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho",
"Liberia","Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
"Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius",
"Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco",
"Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
"Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
"Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
"Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
"Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
"Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles",
"Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
"South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
"Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania",
"Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
"Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates",
"United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
"Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const handleChange=(e)=>{
setLocation({...location,[e.target.name]:e.target.value});
};

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Workshop Location
</h2>

{/* Country */}

<label className="text-sm text-gray-600">Country</label>

<select
name="country"
onChange={handleChange}
className="w-full border p-2 rounded mb-3"
>

<option value="">Select Country</option>

{countries.map((country,index)=>(
<option key={index} value={country}>
{country}
</option>
))}

</select>

{/* City */}

<label className="text-sm text-gray-600">City</label>

<input
name="city"
placeholder="City"
onChange={handleChange}
className="w-full border p-2 rounded mb-3"
/>

{/* Address */}

<label className="text-sm text-gray-600">Street Address</label>

<input
name="address"
placeholder="Street Address"
onChange={handleChange}
className="w-full border p-2 rounded mb-4"
/>

<button className="w-full bg-black text-white py-2 rounded">
Save
</button>

</div>

);
}
