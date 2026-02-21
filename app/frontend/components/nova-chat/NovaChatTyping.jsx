import React from 'react'

export default function NovaChatTyping() {
  return (
    <div className="flex gap-2.5 justify-start">
      <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-sm shrink-0">
        🌱
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-stone-100">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-teal-400 rounded-full"
              style={{
                animation: 'nova-bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes nova-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
