import { useState } from "react";

export default function HelpCenter(){

const articles = [
{
title:"How to upload products",
content:"To upload a product, go to the omoworkit page and click 'Add Product'. Upload clear images of your product, enter the product name and description, set the price, and publish it so customers can view it."
},
{
title:"How to receive payments",
content:"Payments are handled directly between the client and the seller. When a customer is interested in your product or service, they will contact you through the platform. You and the client can agree on a payment method and complete the transaction. The platform only connects buyers and sellers and does not process payments."
},
{
title:"How to manage orders",
content:"To manage your orders, go to the Orders page from your dashboard. There you can view incoming orders, communicate with customers, and update the order status once the product or service is completed."
},
{
title:"How to contact support",
content:"If you need help with your account or omoworkit, open Settings, go to the Help & Support section, and select Contact Support. Send your message and our support team will respond as soon as possible."
}
];

return(

<div className="max-w-md mx-auto p-4">

<h2 className="text-xl font-bold mb-4">
Help Center
</h2>

<p className="text-sm text-gray-500 mb-4">
Find answers and learn how to use the marketplace.
</p>

{articles.map((item,index)=>(
<div key={index} className="border p-3 rounded mb-3">

<h3 className="font-semibold mb-1">
{item.title}
</h3>

<p className="text-sm text-gray-600">
{item.content}
</p>

</div>
))}

</div>

);
}
