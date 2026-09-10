import { Database, FileUp, FlaskConical } from "lucide-react";
import Link from "next/link";

const sources = [
  { href: "/upload", label: "Upload File", icon: FileUp },
  { href: "/datasets", label: "NASA MAST", icon: Database },
  { href: "/demo", label: "Demo", icon: FlaskConical },
];

export function ObservationSources({ current }: { current: "/upload" | "/upload/local" | "/datasets" | "/demo" }) {
  return (
    <nav className="intake-sources" aria-label="Observation source">
      {sources.map((source) => (
        <Link
          href={source.href}
          key={source.href}
          aria-current={source.href === current ? "page" : undefined}
          className={source.href === current ? "is-active" : ""}
        >
          <source.icon aria-hidden="true" />
          <span>{source.label}</span>
        </Link>
      ))}
    </nav>
  );
}
