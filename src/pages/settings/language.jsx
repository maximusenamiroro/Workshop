import React, { useState } from "react";
import { FaArrowLeft, FaSearch, FaChevronRight } from "react-icons/fa";

const allLanguages = [
  "English","Spanish","French","German","Portuguese","Chinese","Japanese",
  "Arabic","Russian","Hindi","Bengali","Urdu","Korean","Italian","Dutch",
  "Swedish","Turkish","Vietnamese","Thai","Polish","Greek","Hebrew","Persian",
  "Indonesian","Malay","Swahili","Tamil","Telugu","Gujarati","Punjabi"
];

export default function LanguageSettings({ onBack }) {

  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [search, setSearch] = useState("");
  const [openSelector, setOpenSelector] = useState(false);
  const [translatePosts, setTranslatePosts] = useState(true);

  const filteredLanguages = allLanguages.filter((lang) =>
    lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">

      {/* Back */}
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2"/>
        <span className="font-semibold text-lg">Language</span>
      </div>

      {/* App Language */}
      <div
        className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-100 cursor-pointer"
        onClick={() => setOpenSelector(true)}
      >
        <div className="flex items-center gap-2">
          <FaSearch className="text-gray-400"/>
          <div>
            <p className="text-sm font-medium">Select App Language</p>
            <p className="text-xs text-gray-500">{selectedLanguage}</p>
          </div>
        </div>
        <FaChevronRight className="text-gray-400"/>
      </div>

      {/* Language Selector */}
      {openSelector && (
        <div className="mt-3 border rounded-xl p-3 max-h-60 overflow-y-auto">

          <input
            type="text"
            placeholder="Search language"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          />

          {filteredLanguages.map((lang,index)=>(
            <div
              key={index}
              className="flex justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              onClick={()=>{
                setSelectedLanguage(lang);
                setOpenSelector(false);
                setSearch("");
              }}
            >
              <span>{lang}</span>
              {selectedLanguage===lang && <span className="text-green-500">✓</span>}
            </div>
          ))}

        </div>
      )}

      {/* Translate Posts */}
      <div className="flex justify-between items-center mt-6 p-3 rounded-xl hover:bg-gray-100">
        <div>
          <p className="text-sm font-medium">Translate Posts</p>
          <p className="text-xs text-gray-500">
            Automatically translate posts into your selected app language.
          </p>
        </div>

        <input
          type="checkbox"
          checked={translatePosts}
          onChange={()=>setTranslatePosts(!translatePosts)}
        />
      </div>

      {/* Don't Translate */}
      <div className="mt-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer">
        <p className="text-sm font-medium">Don't Translate</p>
        <p className="text-xs text-gray-500">
          Posts will appear in their original language without automatic translation.
        </p>
      </div>

      {/* Translation Info */}
      <div className="mt-5 text-xs text-gray-500 leading-relaxed">
        Translation helps you understand posts written in other languages.  
        When enabled, posts may automatically appear in your selected app language.  
        You can turn translation off anytime if you prefer to view content in its original language.
      </div>

    </div>
  );
}