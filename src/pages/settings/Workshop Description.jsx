import { useState } from "react";

export default function BlockedUsers() {

const [blocked,setBlocked] = useState([]);

const unblockUser = (username)=>{
setBlocked(blocked.filter(user => user !== username));
};

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">Blocked Users</h2>

<p className="text-sm text-gray-500 mb-4">
People you block cannot message you, view your workshop, or interact with your posts.
</p>

{blocked.length === 0 ? (

<div className="text-center text-gray-400 mt-10">
🚫
<p className="mt-2">You have not blocked anyone.</p>
</div>

) : (

blocked.map((user,index)=>(

<div
key={index}
className="flex justify-between items-center border p-3 rounded mb-2"
>

<span>{user}</span>

<button
onClick={()=>unblockUser(user)}
className="text-red-500"
>
Unblock
</button>

</div>

))

)}

</div>

);

}
