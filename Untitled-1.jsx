import React, { useState } from "react";
import {
FaBookmark,
FaShoppingBag,
FaBox,
FaUserEdit,
FaCamera,
FaHome,
FaInbox,
FaTools,
FaUser,
FaEllipsisV
} from "react-icons/fa";

function WorkshopProfile(){

const [profileImage,setProfileImage] = useState(null);
const [plusMenu,setPlusMenu] = useState(false);
const [threeMenu,setThreeMenu] = useState(false);
const [showEdit,setShowEdit] = useState(false);
const [activeTab,setActiveTab] = useState("saved");

/* USER STATE */

const [user,setUser] = useState({
username:"Username",
phone:"Phone Number",
country:"Country"
});

/* TEMP STATE FOR EDIT FORM */

const [formData,setFormData] = useState(user);

/* IMAGE CHANGE */

const changeProfile=(e)=>{
const file=e.target.files[0];
if(file){
setProfileImage(URL.createObjectURL(file));
}
};

/* FORM INPUT */

const handleChange=(e)=>{
setFormData({
...formData,
[e.target.name]:e.target.value
});
};

/* SAVE PROFILE */

const saveProfile=()=>{
setUser(formData);
setShowEdit(false);
};

return(

<div style={styles.page}>

<div style={styles.container}>

{/* 3 DOT MENU */}

<div style={styles.topMenu}>

<FaEllipsisV
onClick={()=>setThreeMenu(!threeMenu)}
style={{cursor:"pointer"}}
/>

{threeMenu &&(

<div style={styles.dropdown}>

<p>About</p>
<p>Settings</p>

</div>

)}

</div>

{/* USERNAME */}

<h2 style={styles.username}>{user.username}</h2>

{/* PROFILE IMAGE */}

<div style={styles.profileBox}>

<img
src={profileImage || "https://via.placeholder.com/130"}
style={styles.profileImage}
/>

<button
style={styles.plusBtn}
onClick={()=>setPlusMenu(!plusMenu)}
>
+
</button>

{/* PLUS MENU */}

{plusMenu &&(

<div style={styles.plusMenu}>

<div
style={styles.menuIcon}
onClick={()=>setShowEdit(!showEdit)}
>
<FaUserEdit/>
</div>

<label style={styles.menuIcon}>

<FaCamera/>

<input
type="file"
accept="image/*"
onChange={changeProfile}
style={{display:"none"}}
/>

</label>

</div>

)}

</div>

{/* PHONE */}

<p style={styles.phone}>{user.phone}</p>

{/* COUNTRY */}

<p style={styles.country}>{user.country}</p>

{/* EDIT FORM */}

{showEdit &&(

<div style={styles.editBox}>

<input
name="username"
placeholder="username"
value={formData.username}
onChange={handleChange}
style={styles.input}
/>

<input
name="phone"
placeholder="phone"
value={formData.phone}
onChange={handleChange}
style={styles.input}
/>

<input
name="country"
placeholder="country"
value={formData.country}
onChange={handleChange}
style={styles.input}
/>

<button
style={styles.saveBtn}
onClick={saveProfile}
>
Save
</button>

</div>

)}

{/* PROFILE ICONS */}

<div style={styles.iconTabs}>

<div
style={activeTab==="saved"?styles.activeIcon:styles.icon}
onClick={()=>setActiveTab("saved")}
>
<FaBookmark size={22}/>
</div>

<div
style={activeTab==="purchased"?styles.activeIcon:styles.icon}
onClick={()=>setActiveTab("purchased")}
>
<FaShoppingBag size={22}/>
</div>

<div
style={activeTab==="orders"?styles.activeIcon:styles.icon}
onClick={()=>setActiveTab("orders")}
>
<FaBox size={22}/>
</div>

</div>

{/* CONTENT */}

<div style={styles.content}>

{activeTab==="saved" && <p>Saved products</p>}
{activeTab==="purchased" && <p>Purchased products</p>}
{activeTab==="orders" && <p>Orders</p>}

</div>

</div>

{/* BOTTOM NAV */}

<div style={styles.bottomNav}>

<div style={styles.navItem}>
<FaHome size={22}/>
<p>Home</p>
</div>

<div style={styles.navItem}>
<FaInbox size={22}/>
<p>Inbox</p>
</div>

<div style={styles.navItem}>
<FaTools size={22}/>
<p>Workshop</p>
</div>

<div style={styles.activeNav}>
<FaUser size={22}/>
<p>Profile</p>
</div>

</div>

</div>

);

}

export default WorkshopProfile;

/* STYLES */

const styles={

page:{
minHeight:"100vh",
background:"#f3f3f3",
fontFamily:"Arial",
paddingBottom:"70px"
},

container:{
maxWidth:"500px",
margin:"auto",
background:"white",
marginTop:"40px",
padding:"30px",
borderRadius:"12px",
textAlign:"center",
boxShadow:"0 6px 18px rgba(0,0,0,0.1)",
position:"relative"
},

topMenu:{
position:"absolute",
top:"20px",
right:"20px"
},

dropdown:{
position:"absolute",
right:"0",
top:"25px",
background:"white",
border:"1px solid #ddd",
padding:"10px",
borderRadius:"6px"
},

username:{
color:"#0b6b3a"
},

profileBox:{
position:"relative",
display:"inline-block"
},

profileImage:{
width:"130px",
height:"130px",
borderRadius:"50%",
objectFit:"cover"
},

plusBtn:{
position:"absolute",
bottom:"0",
right:"0",
background:"#0b6b3a",
color:"white",
border:"none",
width:"30px",
height:"30px",
borderRadius:"50%",
cursor:"pointer"
},

plusMenu:{
position:"absolute",
top:"140px",
right:"0",
background:"white",
border:"1px solid #ddd",
padding:"10px",
borderRadius:"6px",
display:"flex",
gap:"10px"
},

menuIcon:{
cursor:"pointer",
fontSize:"18px",
color:"#0b6b3a"
},

phone:{
marginTop:"10px",
color:"#555"
},

country:{
color:"#777"
},

editBox:{
marginTop:"15px"
},

input:{
width:"100%",
padding:"10px",
marginTop:"8px",
borderRadius:"6px",
border:"1px solid #ccc"
},

saveBtn:{
marginTop:"10px",
background:"#0b6b3a",
color:"white",
border:"none",
padding:"10px",
width:"100%",
borderRadius:"6px",
cursor:"pointer"
},

iconTabs:{
display:"flex",
justifyContent:"space-around",
marginTop:"25px",
borderTop:"1px solid #eee",
paddingTop:"15px"
},

icon:{
cursor:"pointer",
color:"#555"
},

activeIcon:{
cursor:"pointer",
color:"#0b6b3a"
},

content:{
marginTop:"20px"
},

bottomNav:{
position:"fixed",
bottom:"0",
left:"0",
right:"0",
background:"white",
display:"flex",
justifyContent:"space-around",
borderTop:"1px solid #ddd",
padding:"10px 0"
},

navItem:{
textAlign:"center",
color:"#555"
},

activeNav:{
textAlign:"center",
color:"#0b6b3a"
}

};