import { useNavigate } from "react-router-dom";

export default function TermsOfUse() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      <div className="sticky top-0 bg-[#0B0F19]/95 backdrop-blur border-b border-white/10 px-4 py-4 flex items-center gap-3 z-50">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1 text-xl">←</button>
        <h1 className="font-bold text-lg">Terms of Use</h1>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm text-gray-300 leading-relaxed">

        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Last updated: June 2026</p>
          <p className="text-green-400 font-semibold mt-1">Omoworkit Platform Terms of Use</p>
          <p className="text-xs text-gray-400 mt-1">
            Please read these terms carefully before using omoworkit.com
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          By accessing or using Omoworkit (omoworkit.com), you agree to be bound by these Terms of Use
          and all applicable laws and regulations. If you do not agree with any part of these terms,
          you must not use the platform. These terms apply to all users including clients, workers,
          and visitors.
        </Section>

        <Section title="2. Description of Service">
          Omoworkit is an online marketplace platform that connects clients seeking services with
          skilled workers and businesses. The platform facilitates discovery, booking, ordering,
          real-time tracking, and communication between parties. Omoworkit acts as an intermediary
          and is not a party to any agreement made between clients and workers.
        </Section>

        <Section title="3. User Accounts">
          <ul className="list-disc pl-5 space-y-2">
            <li>You must be at least 18 years old to create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must provide accurate, current, and complete information during registration.</li>
            <li>You may not create multiple accounts for the same person or business.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>Omoworkit reserves the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </Section>

        <Section title="4. Worker and Business Accounts">
          Workers and businesses on Omoworkit agree to:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Provide honest and accurate descriptions of their services and products.</li>
            <li>Not misrepresent qualifications, experience, or identity.</li>
            <li>Honour accepted bookings and orders in a professional manner.</li>
            <li>Only share location data when they have chosen to go live or start a tracking session.</li>
            <li>Not solicit clients to pay outside the platform in ways that bypass accountability.</li>
          </ul>
        </Section>

        <Section title="5. Client Accounts">
          Clients on Omoworkit agree to:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Only make genuine booking and order requests.</li>
            <li>Treat workers and businesses with respect.</li>
            <li>Not make fraudulent complaints or false reviews.</li>
            <li>Honour payment obligations for services or products received.</li>
          </ul>
        </Section>

        <Section title="6. Location Tracking">
          Omoworkit provides a voluntary, consent-based live location tracking feature.
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Workers must manually activate location sharing. Nothing is tracked automatically.</li>
            <li>Clients may choose to share their location so workers know where to go.</li>
            <li>Either party can stop sharing their location at any time.</li>
            <li>Location data is only stored for the duration of an active session and is not retained
            permanently once a session ends.</li>
            <li>Omoworkit does not sell or share location data with third parties.</li>
          </ul>
        </Section>

        <Section title="7. Content and Reels">
          Workers may post short video reels to showcase their services. By posting content you agree that:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>You own the content or have the right to post it.</li>
            <li>The content does not violate any laws or the rights of others.</li>
            <li>Content must not contain nudity, violence, hate speech, or misleading claims.</li>
            <li>Omoworkit reserves the right to remove content that violates these guidelines.</li>
            <li>By posting content you grant Omoworkit a non-exclusive licence to display it on the platform.</li>
          </ul>
        </Section>

        <Section title="8. Messaging and Communications">
          The in-app messaging system including text, images, and voice notes is provided for
          legitimate business communication between clients and workers. You must not use messaging
          to send spam, harassing content, illegal content, or unsolicited promotional material.
          Omoworkit does not monitor private messages but reserves the right to investigate
          reported abuse.
        </Section>

        <Section title="9. Prohibited Conduct">
          The following are strictly prohibited on Omoworkit:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Impersonating another person or business.</li>
            <li>Using the platform for illegal activities.</li>
            <li>Attempting to hack, disrupt, or reverse-engineer the platform.</li>
            <li>Creating fake reviews or ratings.</li>
            <li>Posting fraudulent products or services.</li>
            <li>Collecting other users' data without consent.</li>
            <li>Using automated scripts or bots to interact with the platform.</li>
          </ul>
        </Section>

        <Section title="10. Limitation of Liability">
          Omoworkit is a marketplace platform and is not responsible for:
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>The quality, safety, or legality of services provided by workers.</li>
            <li>Disputes between clients and workers.</li>
            <li>Loss or damage arising from your use of the platform.</li>
            <li>Interruptions to service due to technical issues beyond our control.</li>
          </ul>
          To the maximum extent permitted by law, Omoworkit's liability is limited to the amount
          paid by the user for the service in question.
        </Section>

        <Section title="11. Intellectual Property">
          The Omoworkit name, logo, platform design, and original content are the intellectual
          property of Omoworkit. You may not reproduce, distribute, or create derivative works
          without written permission. User-generated content remains the property of its creator.
        </Section>

        <Section title="12. Termination">
          Omoworkit reserves the right to suspend or permanently terminate any account that
          violates these Terms of Use, engages in fraudulent activity, or poses a risk to other
          users or the platform — without prior notice where the violation is serious.
        </Section>

        <Section title="13. Changes to Terms">
          Omoworkit may update these Terms of Use at any time. Continued use of the platform
          after changes are posted constitutes acceptance of the updated terms. We will make
          reasonable efforts to notify users of significant changes.
        </Section>

        <Section title="14. Governing Law">
          These Terms of Use are governed by the laws of the Federal Republic of Nigeria.
          Any disputes shall be resolved under Nigerian jurisdiction.
        </Section>

        <Section title="15. Contact">
          For questions about these Terms, contact us through the platform or visit omoworkit.com.
        </Section>

        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-gray-600">© 2026 Omoworkit. All rights reserved.</p>
          <button onClick={() => navigate("/privacy")}
            className="text-green-400 text-xs mt-2 hover:underline">
            View Privacy Policy →
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