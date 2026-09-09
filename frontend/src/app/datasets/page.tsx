"use client";

import { ArrowRight, CalendarDays, Database, FileArchive, LoaderCircle, RotateCcw, Search, Telescope, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ObservationSources } from "@/components/observation-sources";
import { formatFileSize, IntakeStage, intakeError, startObservation } from "@/lib/analysis-intake";
import { api, ApiError } from "@/lib/api";
import type { DatasetSearchResult } from "@/types/api";

type Mission = "all" | "kepler" | "tess";
type SearchState = "initial" | "loading" | "success-with-results" | "success-empty" | "error";
export default function DatasetsPage() { return <ProtectedRoute><DatasetExplorer /></ProtectedRoute>; }

function DatasetExplorer() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [mission, setMission] = useState<Mission>("all");
  const [results, setResults] = useState<DatasetSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("initial");
  const [importing, setImporting] = useState<string | null>(null);
  const [stage, setStage] = useState<IntakeStage>("idle");
  const [error, setError] = useState<string | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    await runSearch();
  }

  async function runSearch() {
    const normalized = target.trim();
    if (!normalized || searchState === "loading") return;
    setSearchState("loading");
    setError(null);
    setResults([]);
    try {
      const found = await api.searchDatasets(normalized, mission);
      setResults(found);
      setSearchState(found.length > 0 ? "success-with-results" : "success-empty");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        if (typeof caught.retryAfter === "number" && caught.retryAfter > 0) {
          setError(
            `MAST search is temporarily rate limited. Please wait ${caught.retryAfter} second${caught.retryAfter === 1 ? "" : "s"} before searching again.`,
          );
        } else {
          setError("MAST search is temporarily rate limited. Wait briefly before searching again.");
        }
      } else if (caught instanceof ApiError) {
        setError(
          caught.status === 0 && caught.message.includes("timed out")
            ? "NASA archive search timed out. The archive did not respond within the allowed time. Try the search again."
            : caught.message,
        );
      } else {
        setError("The MAST archive could not be searched safely.");
      }
      setSearchState("error");
    }
  }

  async function handleObservation(item: DatasetSearchResult) {
    if (importing) return;
    setImporting(item.data_uri);
    setStage("downloading");
    setError(null);
    try {
      const file = await api.downloadDataset(item.data_uri, item.filename);
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setImporting(null);
      setStage("idle");
    }
  }

  const importLabel =
    stage === "downloading"
      ? "Importing FITS…"
      : stage === "uploading"
        ? "Validating observation…"
        : "Preparing analysis…";

  return (
    <main className="app-workspace intake-workspace">
      <header className="intake-header">
        <div>
          <p className="workspace-kicker">Analysis / Public observations</p>
          <h1>Search NASA MAST</h1>
          <p>Find supported public light-curve products and bring one into ExoVision for candidate screening.</p>
        </div>
        <ObservationSources current="/datasets" />
      </header>

      <form className="mast-search" onSubmit={search}>
        <label>
          <span>Target or object identifier</span>
          <div>
            <Search aria-hidden="true" />
            <input
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="Kepler-452, Kepler-10, TOI-700, TIC 307210830"
              required
              maxLength={120}
            />
          </div>
        </label>
        <label>
          <span>Mission</span>
          <select value={mission} onChange={(event) => setMission(event.target.value as Mission)}>
            <option value="all">Kepler, K2, and TESS</option>
            <option value="kepler">Kepler and K2</option>
            <option value="tess">TESS</option>
          </select>
        </label>
        <button type="submit" disabled={searchState === "loading" || !target.trim()}>
          {searchState === "loading" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
          Search MAST
        </button>
      </form>

      <p className="mast-note">
        Search by a catalog identifier, common target name, or supported mission object ID. ExoVision is independent and is not endorsed by NASA.
      </p>

      {error && searchState !== "error" && (
        <div className="intake-error" role="alert">
          {error}
        </div>
      )}

      <section className="mast-results" aria-labelledby="mast-results-heading" aria-live="polite">
        <header>
          <div>
            <p className="dashboard-section-label">Public archive</p>
            <h2 id="mast-results-heading">Observation products</h2>
          </div>
          {(searchState === "success-with-results" || searchState === "success-empty") && (
            <span>
              {results.length} compatible {results.length === 1 ? "product" : "products"}
            </span>
          )}
        </header>

        {searchState === "loading" ? (
          <div className="mast-loading" role="status">
            <span className="sr-only">Searching NASA MAST</span>
            {[0, 1, 2].map((item) => (
              <div className="skeleton-line" key={item} />
            ))}
          </div>
        ) : searchState === "initial" ? (
          <MastState
            icon={Search}
            title="Search supported public observations"
            copy="Enter a target and choose Kepler/K2, TESS, or all supported missions."
          />
        ) : searchState === "error" ? (
          <MastState
            icon={TriangleAlert}
            title="Archive search unavailable"
            copy={error ?? "The archive search could not be completed. Try the search again."}
            action={<button type="button" className="mast-retry" onClick={() => void runSearch()}><RotateCcw aria-hidden="true" /> Retry search</button>}
          />
        ) : searchState === "success-empty" ? (
          <MastState
            icon={Telescope}
            title="No compatible light curves found"
            copy="Check the identifier, try another supported mission, or use the bundled demo."
          />
        ) : (
          <div className="mast-list">
            {results.map((item) => (
              <article key={item.data_uri}>
                <div className="mast-record-main">
                  <span className="mast-record-icon">
                    <Database aria-hidden="true" />
                  </span>
                  <div>
                    <p>{item.mission}</p>
                    <h3>{item.target_name}</h3>
                    <span title={item.filename}>{item.filename}</span>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>
                      <CalendarDays aria-hidden="true" /> Observation period
                    </dt>
                    <dd>{item.observation_period}</dd>
                  </div>
                  <div>
                    <dt>
                      <FileArchive aria-hidden="true" /> Product
                    </dt>
                    <dd>
                      {item.format} · {formatFileSize(item.size_bytes)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => void handleObservation(item)}
                  disabled={importing !== null}
                >
                  {importing === item.data_uri ? (
                    <>
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                      {importLabel}
                    </>
                  ) : (
                    <>
                      Use Observation <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="intake-crosslink">
        Have your own observation? <Link href="/upload">Upload a light curve</Link>, or <Link href="/demo">run the bundled demo</Link>.
      </p>
    </main>
  );
}

function MastState({ icon: Icon, title, copy, action }: { icon: typeof Search; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="mast-state">
      <div className="mast-catalog-visual" aria-hidden="true"><span /><span /><span /><Icon /></div>
      <div><p className="dashboard-section-label">MAST catalog query</p><h3>{title}</h3><p>{copy}</p>{action}<ul aria-hidden="true"><li>Kepler</li><li>K2</li><li>TESS</li></ul></div>
    </div>
  );
}
