import { Swords } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-to-b from-sw-dark/95 to-sw-black/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
        <Swords className="text-sw-gold drop-shadow-[0_0_8px_rgba(255,197,0,0.4)]" size={28} />
        <h1 className="text-xl font-black font-[--font-sw-title] tracking-wider">
          <span className="text-sw-gold drop-shadow-[0_0_12px_rgba(255,197,0,0.5)]">LEGO</span>
          <span className="text-sw-text"> STAR WARS </span>
          <span className="text-sw-text-dim font-normal text-base font-sans tracking-normal">Minifig Tracker</span>
        </h1>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-sw-gold/60 to-transparent" />
    </header>
  );
}
