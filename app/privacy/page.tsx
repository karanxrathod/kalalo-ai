import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Kalalo",
  description: "Privacy Policy and data security practices for the Kalalo AI video captioning studio.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090B0E] text-slate-300">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Kalalo</span>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-[#101318]/90 p-8 sm:p-12 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-slate-500 mt-1">Last updated: October 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Overview</h2>
              <p>
                Kalalo (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the platform&rdquo;) provides automated AI video captioning, subtitle editing, and rendering tools. We are committed to transparency and respect for creator privacy and data ownership.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Media & Processing Data</h2>
              <p>
                When you upload audio or video files to Kalalo, they are stored securely in your dedicated Supabase Storage bucket or processed locally during transient rendering tasks. Media files are used strictly for audio transcription via the Google Gemini API and video subtitle burn-in. We do not sell your source media or use your private video footage to train third-party models.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. User Authentication & Credentials</h2>
              <p>
                Authentication credentials, passwords, and sessions are encrypted and managed securely via Supabase Auth and industry-standard salted bcrypt hashing. Your account data is isolated through PostgreSQL Row-Level Security (RLS) policies, ensuring only you have access to your personal projects and caption files.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. AI Provider Interactions</h2>
              <p>
                Transcription requests are dispatched securely over HTTPS to Google Gemini. Audio streams submitted for transcription are processed under Google Cloud&apos;s standard developer enterprise data privacy guarantees.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention & Deletion</h2>
              <p>
                You retain complete ownership of all uploaded videos, generated subtitle files (SRT/VTT), and rendered media. You may delete your projects and associated media at any time through your dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Contact</h2>
              <p>
                If you have questions about your data privacy or security at Kalalo, reach out to our team at support@kalalo.ai.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
