"use client";

import { ArrowRight, FileCheck2, FileText, FileUp, Info, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { formatFileSize, IntakeStage, intakeError, startObservation, validateObservationFile } from "@/lib/analysis-intake";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<IntakeStage>("idle");
  const busy = stage !== "idle";

  function choose(next?: File) {
    const validation = validateObservationFile(next);
    setError(validation);
    setFile(validation ? null : next ?? null);
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    choose(selected);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0]);
  }

  function remove() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file || busy) return;
    setError(null);
    try {
      const analysisId = await startObservation(file, setStage);
      router.push(`/results/${analysisId}`);
    } catch (caught) {
      setError(intakeError(caught));
      setStage("idle");
    }
  }

  const label =
    stage === "uploading"
      ? "Uploading observation…"
      : stage === "starting"
        ? "Preparing analysis…"
        : "Start Candidate Screening";

  const extension = file ? file.name.split(".").pop()?.toUpperCase() : null;

  return (
    <div className="intake-layout">
      <section className="intake-panel" aria-labelledby="observation-file-heading">
        <div className="intake-panel-heading">
          <span>01</span>
          <div>
            <p>Observation file</p>
            <h2 id="observation-file-heading">Choose a light curve</h2>
          </div>
        </div>

        <div
          className={`intake-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            id="lightcurve-file"
            type="file"
            accept=".fits,.csv,.txt"
            onChange={onInput}
            disabled={busy}
            aria-describedby={error ? "file-guidance file-error" : "file-guidance"}
          />
          {!file ? (
            <label htmlFor="lightcurve-file">
              <span className="intake-drop-icon">
                <FileUp aria-hidden="true" />
              </span>
              <strong>Drop an observation here</strong>
              <span>or choose a file from your device</span>
              <b>Browse files</b>
            </label>
          ) : (
            <div className="intake-selected">
              <span>
                <FileCheck2 aria-hidden="true" />
              </span>
              <div>
                <p>Selected observation</p>
                <h3>{file.name}</h3>
                <dl>
                  <div>
                    <dt>Format</dt>
                    <dd>{extension}</dd>
                  </div>
                  <div>
                    <dt>File size</dt>
                    <dd>{formatFileSize(file.size)}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  <RotateCcw aria-hidden="true" /> Choose another
                </button>
                <button type="button" onClick={remove} disabled={busy}>
                  <X aria-hidden="true" /> Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <p id="file-guidance" className="intake-file-guidance">
          <Info aria-hidden="true" /> FITS, CSV, or TXT · Default deployment limit 25 MiB · Server validation remains authoritative.
        </p>

        {error && (
          <p className="intake-error" id="file-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="intake-submit"
          type="button"
          onClick={() => void submit()}
          disabled={!file || busy}
        >
          {busy && <LoaderCircle className="animate-spin" aria-hidden="true" />}
          {label}
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <aside className="intake-expectations">
        <div className="intake-panel-heading">
          <span>02</span>
          <div>
            <p>Input requirements</p>
            <h2>What ExoVision expects</h2>
          </div>
        </div>
        <p>A time-series light curve containing observation time and stellar flux or brightness measurements.</p>
        <ul>
          <li>
            <FileText aria-hidden="true" />
            <span>
              <strong>FITS products</strong>Compatible products may provide the required time and flux columns automatically.
            </span>
          </li>
          <li>
            <FileText aria-hidden="true" />
            <span>
              <strong>CSV and TXT</strong>Must contain columns named <code>time</code> and <code>flux</code>. Optional <code>flux_error</code>, <code>flux_err</code>, and <code>quality</code> columns are supported.
            </span>
          </li>
        </ul>
        <div className="intake-sequence">
          <p>Analysis sequence</p>
          <ol>
            <li>
              <span>1</span>Upload and validate
            </li>
            <li>
              <span>2</span>Prepare observation
            </li>
            <li>
              <span>3</span>Open live processing
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
