export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 pointer-events-none">
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/20 shadow">
          <div className="h-full w-1/3 animate-[loading_1.2s_ease_infinite] rounded-full bg-yellow-400" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}


