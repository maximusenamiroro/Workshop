import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

function FAQ({ onBack }) {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" /> Back
      </div>
      <h2 className="text-xl font-bold mb-3">FAQ / Help Center</h2>
      <p className="text-sm text-gray-600">Here are answers to common questions.</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li>• How do I create an account?</li>
        <li>• How do clients hire sellers?</li>
        <li>• How do sellers receive payments?</li>
        <li>• How do I update my profile?</li>
      </ul>
    </div>
  );
}

function ReportProblem({ onBack }) {
  const [screenshot, setScreenshot] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(URL.createObjectURL(file));
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" /> Back
      </div>
      <h2 className="text-xl font-bold mb-3">Report a Problem</h2>

      <form className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Describe the problem"
          className="border p-2 rounded"
        />

        <textarea
          placeholder="Explain what happened..."
          className="border p-2 rounded"
          rows={4}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Upload Screenshot (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="border p-2 rounded"
          />
        </div>

        {screenshot && (
          <img
            src={screenshot}
            alt="Screenshot preview"
            className="mt-2 rounded-lg border max-h-40 object-contain"
          />
        )}

        <button className="bg-green-700 text-white py-2 rounded">
          Submit Report
        </button>
      </form>
    </div>
  );
}

function SendFeedback({ onBack }) {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" /> Back
      </div>
      <h2 className="text-xl font-bold mb-3">Send Feedback</h2>

      <form className="flex flex-col gap-3">
        <textarea
          placeholder="Share your suggestions..."
          className="border p-2 rounded"
          rows={4}
        />
        <button className="bg-green-700 text-white py-2 rounded">
          Send Feedback
        </button>
      </form>
    </div>
  );
}

function CommunityGuidelines({ onBack }) {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" /> Back
      </div>
      <h2 className="text-xl font-bold mb-3">Community Guidelines</h2>
      <ul className="space-y-2 text-sm text-gray-600">
        <li>• Be respectful to all users.</li>
        <li>• Do not post illegal or harmful content.</li>
        <li>• No scams or misleading services.</li>
        <li>• Protect your account information.</li>
      </ul>
    </div>
  );
}

function ContactSupport({ onBack }) {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" /> Back
      </div>
      <h2 className="text-xl font-bold mb-3">Contact Support</h2>

      <form className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Your email"
          className="border p-2 rounded"
        />
        <textarea
          placeholder="How can we help you?"
          className="border p-2 rounded"
          rows={4}
        />
        <button className="bg-green-700 text-white py-2 rounded">
          Send Message
        </button>
      </form>
    </div>
  );
}

export default function HelpAndFeedback() {
  const [page, setPage] = useState("home");

  const helpOptions = [
    { name: "FAQ / Help Center", key: "faq" },
    { name: "Report a Problem", key: "report" },
    { name: "Send Feedback", key: "feedback" },
    { name: "Community Guidelines", key: "guidelines" },
    { name: "Contact Support", key: "support" },
  ];

  if (page === "faq") return <FAQ onBack={() => setPage("home")} />;
  if (page === "report") return <ReportProblem onBack={() => setPage("home")} />;
  if (page === "feedback") return <SendFeedback onBack={() => setPage("home")} />;
  if (page === "guidelines") return <CommunityGuidelines onBack={() => setPage("home")} />;
  if (page === "support") return <ContactSupport onBack={() => setPage("home")} />;

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">
      <h2 className="font-bold text-lg mb-4">Help & Feedback</h2>

      <ul className="space-y-3">
        {helpOptions.map((option, index) => (
          <li
            key={index}
            onClick={() => setPage(option.key)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            <span className="text-sm font-medium">{option.name}</span>
            <span>{">"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
