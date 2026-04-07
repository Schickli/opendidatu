"use client";

import { useRef } from "react";
import Link from "next/link";
import { BarChart3, LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data-context";

export function ZentraleHeader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    posten,
    meldungCount,
    error,
    isLoading,
    importedOverlay,
    isLoadingImportedOverlay,
    isUploadingImportedOverlay,
    overlayError,
    uploadImportedOverlay,
    clearImportedOverlay,
  } = useData();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      await uploadImportedOverlay(file);
    } catch {
      // The shared overlay state already exposes a user-facing error.
    }
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
          OpenDidatu
        </h1>
        <div className="h-4 w-px bg-border" />
        <span className="font-mono text-xs text-muted-foreground">
          Meldungsposten
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        {isLoading ? <span>Synchronisiert...</span> : null}
        {error ? <span className="text-destructive">{error}</span> : null}
        {overlayError ? (
          <span className="max-w-52 truncate text-destructive">
            {overlayError}
          </span>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,.kml"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2 font-mono text-[11px] uppercase tracking-wider"
          disabled={isUploadingImportedOverlay}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploadingImportedOverlay ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            <Upload className="size-3" />
          )}
          Overlay
        </Button>
        {isLoadingImportedOverlay ? <span>Overlay wird geladen...</span> : null}
        {importedOverlay ? (
          <>
            <span
              className="max-w-48 truncate"
              title={importedOverlay.fileName}
            >
              {importedOverlay.fileName}
            </span>
            <span>{importedOverlay.featureCount} Features</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7"
              disabled={isUploadingImportedOverlay}
              onClick={() => {
                void clearImportedOverlay().catch(() => undefined);
              }}
              title="Overlay entfernen"
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : null}
        <div className="h-4 w-px bg-border" />
        <span>{posten.length} Posten</span>
        <div className="h-4 w-px bg-border" />
        <span>{meldungCount} Meldungen</span>
        <div className="h-4 w-px bg-border" />
        <Link
          href="/analytics"
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Datenqualität"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
