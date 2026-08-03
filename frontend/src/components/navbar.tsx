import { Orbit, Upload } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#070b12]/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8" aria-label="Primary navigation">
        <Link className="flex items-center gap-2.5 font-semibold tracking-tight text-white" href="/">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-300/10 text-sky-300">
            <Orbit className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>ExoVision <span className="text-sky-300">AI</span></span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Button key={link.href} href={link.href} variant="ghost" className="hidden sm:inline-flex">
              {link.label}
            </Button>
          ))}
          <Button href="/upload" className="ml-1">
            <Upload className="h-4 w-4" aria-hidden="true" />
            New analysis
          </Button>
        </div>
      </nav>
    </header>
  );
}
