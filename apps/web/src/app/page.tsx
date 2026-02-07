import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white font-sans p-8">
      <main className="max-w-4xl w-full text-center space-y-12">

        <div className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 sm:text-7xl">
            YouTube Subtitle Generator
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            AI-powered, real-time subtitles for any YouTube video.
            Powered by Next.js, OpenAI Whisper, and Groq.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4 text-white">How it works</h2>
            <ol className="list-decimal list-inside space-y-3 text-zinc-300">
              <li>Install our Chrome Extension</li>
              <li>Navigate to any YouTube video</li>
              <li>The extension captures audio automatically</li>
              <li>Our Next.js API processes it with Whisper AI</li>
              <li>Subtitles appear instantly on screen</li>
            </ol>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h2 className="text-2xl font-bold mb-4 text-white">Tech Stack</h2>
            <ul className="space-y-2 text-zinc-300">
              <li>🚀 <strong>Next.js 15 App Router</strong> - specific-platform</li>
              <li>🧩 <strong>Chrome Extension</strong> - Manifest V3</li>
              <li>⚡ <strong>Groq & Whisper</strong> - Ultra-fast AI</li>
              <li>🎨 <strong>Tailwind CSS</strong> - Modern styling</li>
              <li>🐻 <strong>Zustand</strong> - State management</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/api/transcribe"
            className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
          >
            Check API Status
          </Link>
          <a
            href="#"
            className="px-8 py-4 rounded-full border border-zinc-700 hover:bg-zinc-900 transition-colors"
          >
            Download Extension (Dist)
          </a>
        </div>
      </main>

      <footer className="mt-16 text-zinc-600">
        &copy; 2024 YouTube Subtitle Gen • Built with ❤️
      </footer>
    </div>
  );
}
