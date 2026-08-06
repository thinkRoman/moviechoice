export default function ShowLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] pt-20 text-white">
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <div className="h-80 rounded-[2rem] bg-white/5" />
        <div className="mt-6 h-8 w-1/2 rounded bg-white/5" />
        <div className="mt-4 h-24 rounded bg-white/5" />
      </div>
    </main>
  );
}
