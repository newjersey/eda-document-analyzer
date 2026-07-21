import DocumentValidator from "../components/DocumentValidator";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-black"
      aria-label="main content"
    >
      <DocumentValidator />
    </main>
  );
}
