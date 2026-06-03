import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <div className="sticky top-0 bg-[#0B0F19]/95 backdrop-blur border-b border-white/10 px-4 py-4 flex items-center gap-3 z-50">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1 text-xl">←</button>
        <h1 className="font-bold text-lg">Privacy Policy</h1>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm text-gray-300 leading-relaxed">

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Last updated: June 2026</p>
          <p className="text-blue-400 font-semibold mt-1">Omoworkit Privacy Policy</p>
          <p className="text-xs text-gray-400 mt-1">
            We are committed to protecting your privacy. This policy explains what data we collect,
            why we collect it, and how we protect it.
          </p>
        </div>

        <Section title="1. Who We Are">
          Omoworkit (omoworkit.com) is a Nigerian marketplace platform connecting clients with skilled
          workers and businesses. We take your privacy seriously and have designed our platform with
          privacy as a core principle — not an afterthought.
        </Section>

        <Section title="2. Data We Collect">
          <p className="mb-2 font-medium text-white">Information you provide:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Full name and email address (required for account creation)</li>
            <li>Phone number (optional)</li>
            <li>Country and business location (optional)</li>
            <li>Profile photo (optional)</li>
            <li>Business category and description</li>
            <li>Messages, voice notes, and images sent through the platform</li>
            <li>Reels (videos) you post</li>
            <li>Ratings and reviews you submit</li>
          </ul>
          <p className="mb-2 font-medium text-white">Information collected automatically:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>GPS location — only when you manually activate Go Live or Start Tracking</li>
            <li>Profile view counts (how many people visited your profile)</li>
            <li>Reel view counts</li>
            <li>Device type and browser (for technical support purposes)</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">To provide the service</strong> — connecting you with workers or clients, processing bookings and orders.</li>
            <li><strong className="text-white">To enable communication</strong> — delivering messages, voice notes, and images between users.</li>
            <li><strong className="text-white">To enable tracking</strong> — sharing your GPS location with the specific client or worker you are working with, only during an active session.</li>
            <li><strong className="text-white">To show your profile</strong> — displaying your name, photo, ratings, and reels to other users on the platform.</li>
            <li><strong className="text-white">To send notifications</strong> — alerting you to bookings, orders, messages, and likes.</li>
            <li><strong className="text-white">To improve the platform</strong> — understanding which features are used most.</li>
          </ul>
        </Section>

        <Section title="4. Location Data — Special Notice">
          Location is the most sensitive data we handle. Here is our exact policy:
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong className="text-white">Workers:</strong> Your GPS location is only collected when you manually tap "Go Live" or "Start Tracking." Nothing is collected in the background.</li>
            <li><strong className="text-white">Clients:</strong> Your location is only shared when you manually tap "Share My Location" in the tracking screen.</li>
            <li><strong className="text-white">Session-only:</strong> Location coordinates are stored in our database only for the duration of an active session. When you go offline or stop tracking, your coordinates are removed.</li>
            <li><strong className="text-white">No selling:</strong> We do not sell, share, or monetise location data with any third party, advertiser, or data broker.</li>
            <li><strong className="text-white">Access:</strong> Only you and the specific person you are working with can see your location.</li>
          </ul>
        </Section>

        <Section title="5. Data Storage and Security">
          Your data is stored on Supabase — a secure, enterprise-grade database platform running
          on Amazon Web Services (AWS) infrastructure. We implement the following protections:
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong className="text-white">Passwords:</strong> Hashed using bcrypt — never stored in plain text. Not even we can see your password.</li>
            <li><strong className="text-white">Authentication:</strong> JWT (JSON Web Token) based — industry standard used by major tech companies.</li>
            <li><strong className="text-white">Database access:</strong> Row Level Security (RLS) is enabled on all tables — you can only access your own data.</li>
            <li><strong className="text-white">Transport:</strong> All data transmitted between your device and our servers is encrypted using HTTPS / TLS 1.3.</li>
            <li><strong className="text-white">Auto-logout:</strong> Your session automatically ends after 30 minutes of inactivity.</li>
            <li><strong className="text-white">File storage:</strong> Images, videos, and voice notes are stored with authenticated access only.</li>
          </ul>
        </Section>

        <Section title="6. Data Sharing">
          We do not sell your personal data. We only share data in the following limited circumstances:
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong className="text-white">With other users:</strong> Your public profile (name, photo, bio, category, reels, ratings) is visible to other users as part of the platform's core function.</li>
            <li><strong className="text-white">With your booking/order partner:</strong> When you accept a booking or order, the relevant contact and location information is shared with the other party only.</li>
            <li><strong className="text-white">With service providers:</strong> Supabase (database and storage), Vercel (hosting). These providers process data only to deliver our service and are bound by their own privacy policies.</li>
            <li><strong className="text-white">Legal obligations:</strong> We may disclose information if required by law or to protect the safety of our users.</li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          You have the following rights regarding your personal data:
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong className="text-white">Access:</strong> You can view all the information on your profile at any time.</li>
            <li><strong className="text-white">Correction:</strong> You can update your name, photo, bio, country, and business details through your profile settings.</li>
            <li><strong className="text-white">Deletion:</strong> You can delete your reels, products, and profile content. Account deletion removes all your data including messages and bookings.</li>
            <li><strong className="text-white">Portability:</strong> You can request a copy of your data by contacting us.</li>
            <li><strong className="text-white">Opt-out:</strong> You can turn off location sharing at any time by going offline or stopping a tracking session.</li>
          </ul>
        </Section>

        <Section title="8. Data Retention">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Active accounts:</strong> Data is retained while your account is active.</li>
            <li><strong className="text-white">Deleted accounts:</strong> When you delete your account, your personal data is deleted within 30 days.</li>
            <li><strong className="text-white">Location data:</strong> Deleted at the end of each live session.</li>
            <li><strong className="text-white">Messages:</strong> Retained until deleted by the user or account deletion.</li>
            <li><strong className="text-white">Transaction records:</strong> Order and booking records may be retained for up to 12 months for dispute resolution purposes.</li>
          </ul>
        </Section>

        <Section title="9. Cookies">
          Omoworkit uses minimal browser storage. We store your authentication token in localStorage
          to keep you logged in. We do not use tracking cookies or advertising cookies. We do not
          use Google Analytics or any third-party tracking service.
        </Section>

        <Section title="10. Children's Privacy">
          Omoworkit is not intended for use by anyone under the age of 18. We do not knowingly
          collect personal data from minors. If we become aware that a minor has registered,
          we will delete their account promptly.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy from time to time. When we make significant changes,
          we will notify users through the platform. The date at the top of this policy indicates
          when it was last updated. Continued use of the platform after changes constitutes
          acceptance of the updated policy.
        </Section>

        <Section title="12. Contact Us">
          If you have any questions, concerns, or requests regarding your privacy or this policy,
          please contact us through the platform at omoworkit.com.
        </Section>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-600">© 2026 Omoworkit. All rights reserved.</p>
          <button onClick={() => navigate("/terms")}
            className="text-green-400 text-xs mt-2 hover:underline">
            View Terms of Use →
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-white font-semibold text-base mb-3">{title}</h2>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}