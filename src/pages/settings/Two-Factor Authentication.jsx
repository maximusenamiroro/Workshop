import { useState } from "react";

export default function TwoFactorAuth() {

const [sms,setSms] = useState(false);
const [authApp,setAuthApp] = useState(false);

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Two-Factor Authentication
</h2>

<p className="text-sm text-gray-500 mb-4">
Add extra security to your account.
</p>

<div className="flex justify-between items-center border p-3 rounded mb-3">
<span>SMS Authentication</span>
<input
type="checkbox"
checked={sms}
onChange={()=>setSms(!sms)}
/>
</div>

<div className="flex justify-between items-center border p-3 rounded">
<span>Authenticator App</span>
<input
type="checkbox"
checked={authApp}
onChange={()=>setAuthApp(!authApp)}
/>
</div>

</div>

);
}
