import { useState } from "react";

export default function DataPrivacy(){

const [privacy,setPrivacy] = useState({
privateAccount:false,
analytics:true,
ads:true
});

const toggle = (key)=>{
setPrivacy({...privacy,[key]:!privacy[key]});
};

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Data & Privacy
</h2>

{/* Private account */}

<div className="flex justify-between items-center border p-3 rounded mb-3">

<span>Private Account</span>

<input
type="checkbox"
checked={privacy.privateAccount}
onChange={()=>toggle("privateAccount")}
/>

</div>

{/* Analytics */}

<div className="flex justify-between items-center border p-3 rounded mb-3">

<span>Allow Analytics</span>

<input
type="checkbox"
checked={privacy.analytics}
onChange={()=>toggle("analytics")}
/>

</div>

{/* Ads */}

<div className="flex justify-between items-center border p-3 rounded mb-4">

<span>Personalized Ads</span>

<input
type="checkbox"
checked={privacy.ads}
onChange={()=>toggle("ads")}
/>

</div>

{/* Data actions */}

<div className="border p-3 rounded mb-2 cursor-pointer">
Download Your Data 
</div>

<div className="border p-3 rounded text-red-500 cursor-pointer">
Delete Account 
</div>

</div>

);
}
