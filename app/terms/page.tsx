import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Kalalo",
  description: "Terms of Service for using the Kalalo AI video captioning studio.",
};

export default function TermsPage() {
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
              <p className="text-xs text-slate-500 mt-1">Last updated: October 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Kalalo, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
              <p>
                Kalalo provides an AI-assisted video captioning studio, subtitle export (SRT, VTT, ASS), and video rendering pipeline supporting multiple languages including Hinglish, Hindi, and English.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. User Content & Conduct</h2>
              <p>
                You retain all intellectual property rights to the videos, audio, and captions you upload or create on Kalalo. You agree not to upload content that violates applicable laws, infringes copyright, or contains malicious payloads.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. AI Transcription & Availability</h2>
              <p>
                Automatic transcription is generated using state-of-the-art AI models (Google Gemini). While transcription accuracy is high, audio quality, background noise, and accent variations can affect output. Users are encouraged to review and edit captions using the built-in caption editor before final rendering or export.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Service Limits & Modifications</h2>
              <p>
                We reserve the right to establish resource limits, such as maximum upload file sizes or concurrent rendering tasks, to ensure platform stability and service quality for all users.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Contact</h2>
              <p>
                For legal inquiries or questions regarding these terms, please contact legal@kalalo.ai.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
