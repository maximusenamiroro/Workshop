import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function BuyerEditProfile() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    phone: "",
    location: "",
    bio: "",
    profile_image: ""
  });

  const [user, setUser] = useState(null);

  // Load Buyer Profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    setUser(user);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log(error);
    }

    setFormData({
      username: data.username || "",
      phone: data.phone || "",
      location: data.location || "",
      bio: data.bio || "",
      profile_image: data.profile_image || ""
    });

    setLoading(false);
  };

  // Handle Input Change
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  // Upload Profile Image
  const handleImageUpload = async (e) => {

    try {

      setUploading(true);

      const file = e.target.files[0];

      const fileName = `buyer-profile-${user.id}-${Date.now()}`;

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

      alert("Image upload failed");
      setUploading(false);
    }
  };

  // Save Profile
  const handleSave = async () => {

    try {

      setLoading(true);

      const { error } = await supabase
        .from("users")
        .update({
          username: formData.username,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          profile_image: formData.profile_image
        })
        .eq("id", user.id);

      if (error) throw error;

      alert("Profile updated successfully");

      navigate("/buyer-profile");

    } catch (error) {

      alert("Error updating profile");
      console.log(error);
    }

    setLoading(false);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">

        <h2 className="text-2xl font-bold text-center mb-6">
          Edit Buyer Profile
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
