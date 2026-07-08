import React from 'react'

export default function FloatingOrbs(){
  return (
    <div aria-hidden className="pointer-events-none">
      <div className="hidden md:block fixed top-20 left-10 w-44 h-44 rounded-full bg-gradient-to-br from-[#FF6A00]/30 to-transparent blur-3xl opacity-60" />
      <div className="hidden md:block fixed bottom-20 right-20 w-52 h-52 rounded-full bg-gradient-to-br from-[#FF6A00]/20 to-transparent blur-3xl opacity-50" />
    </div>
  )
}
