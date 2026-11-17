
import CameraView from "@/components/CameraView";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">
            Rubik's Solver
          </h1>

          <p className="text-gray-400">
            Solve your Rubik's cube with the help of computer vision.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Cube Scanning
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Position one face of the cube within the indicated area.
            </p>
          </div>

          <CameraView />
        </section>

        <footer className="text-center text-sm text-gray-500">
          Rubik's Solver · Developed with Next.js
        </footer>
      </div>
    </main>
  );
}
