import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SellerEditProfile() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    bio: "",
    location: "",
    business_name: "",
    business_description: "",
    profile_image: ""
  });

  const [user, setUser] = useState(null);

  // Load Seller Profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    setUser(user);

    // get user data
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // get seller data
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setFormData({
      username: userData.username || "",
      phone: userData.phone || "",
      bio: userData.bio || "",
      location: userData.location || "",
      business_name: sellerData.business_name || "",
      business_description: sellerData.business_description || "",
      profile_image: userData.profile_image || ""
    });

    setLoading(false);
  };

  // Handle Input
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  // Upload Image
  const handleImageUpload = async (e) => {

    try {

      setUploading(true);

      const file = e.target.files[0];

      const fileName = `profile-${user.id}-${Date.now()}`;

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      setFormData({
        ...formData,
        profile_image: data.publicUrl
      });

      setUploading(false);

    } catch (error) {

      alert("Error uploading image");

      setUploading(false);
    }
  };

  // Save Profile
  const handleSave = async () => {

    try {

      setLoading(true);

      // update users table
      await supabase
        .from("users")
        .update({
          username: formData.username,
          phone: formData.phone,
          bio: formData.bio,
          location: formData.location,
          profile_image: formData.profile_image
        })
        .eq("id", user.id);

      // update sellers table
      await supabase
        .from("sellers")
        .update({
          business_name: formData.business_name,
          business_description: formData.business_description
        })
        .eq("user_id", user.id);

      alert("Profile updated successfully");

      navigate("/seller-profile");

    } catch (error) {

      alert("Error updating profile");
    }

    setLoading(false);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-center mb-6">
          Edit Seller Profile
        </h2>

        {/* Profile Image */}
        <div className="flex flex-col items-center mb-4">

          <img
            src={formData.profile_image || "https://via.placeholder.com/100"}
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-green-800"
          />

          <input
            type="file"
            onChange={handleImageUpload}
            className="mt-3"
          />

          {uploading && <p>Uploading...</p>}

        </div>

        {/* Username */}
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-3"
        />

        {/* Phone */}
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-3"
        />

        {/* Location */}
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-3"
        />

        {/* Bio */}
        <textarea
          name="bio"
          placeholder="Bio"
          value={formData.bio}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-3"
        />

        {/* Business Name */}
        <input
          type="text"
          name="business_name"
          placeholder="Business Name"
          value={formData.business_name}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-3"
        />

        {/* Business Description */}
        <textarea
          name="business_description"
          placeholder="Business Description"
          value={formData.business_description}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-4"
        />

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-green-800 text-white p-3 rounded-lg font-semibold"
        >
          Save Profile
        </button>

      </div>

    </div>
  );
}
