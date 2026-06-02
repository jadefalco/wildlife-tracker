'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminGuard from '@/components/AdminGuard';
import AdminLayout from '@/components/AdminLayout';
import { getObservations, type Observation } from '@/lib/supabase';

function AdminExportPageContent() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'done'>('idle');
  const [exportedFileName, setExportedFileName] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getObservations();
      setObservations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load observations. Please check your Supabase configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      setExportStatus('exporting');
      const res = await fetch('/api/observations/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `kelowna-wildlife-observations-${new Date().toISOString().slice(0, 10)}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportedFileName(fileName);
      setExportStatus('done');
    } catch {
      setError('Failed to export CSV. Please try again.');
      setExportStatus('idle');
    }
  };

  const sightingCount = observations.length;

  const dateRange = (() => {
    if (observations.length === 0) return 'No observations recorded';
    const timestamps = observations.map((o) => new Date(o.observation_timestamp).getTime());
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    if (fmt(min) === fmt(max)) return fmt(min);
    return `${fmt(min)} → ${fmt(max)}`;
  })();

  const exportFileName = `kelowna-wildlife-observations-${new Date().toISOString().slice(0, 10)}.csv`;

  return (
    <AdminLayout title="Province Export">

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Province Submission Info */}
        <div className="rounded-2xl border border-nature-200 bg-white shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-bold text-nature-900">Prepare Submission for Province</h2>
          <p className="text-gray-700 leading-relaxed">
            This application collects the key information commonly required for wildlife observations
            in British Columbia.
          </p>

          <div className="rounded-xl bg-nature-50 p-5 space-y-3">
            <h3 className="font-semibold text-nature-900">Each observation includes:</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Species', desc: 'Category and species name' },
                { label: 'GPS Location', desc: 'Latitude and longitude coordinates' },
                { label: 'Date and Time', desc: 'When the observation was made' },
                { label: 'Photo', desc: 'Visual documentation (if provided)' },
                { label: 'Notes', desc: 'Additional behavioural or habitat details' },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-nature-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-medium text-nature-800">{item.label}</span>
                    <span className="text-nature-600"> — {item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-earth-50 p-4 text-sm text-earth-800">
            <p>
              Export all observations to CSV for manual submission to provincial wildlife databases.
            </p>
          </div>

          <a
            href="https://www2.gov.bc.ca/gov/content/environment/plants-animals-ecosystems/wildlife/wildlife-data-information/submit-wildlife-data-information"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full inline-flex"
          >
            Go to Official BC Wildlife Submission Page
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Export Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
          <h2 className="text-xl font-bold text-nature-900">CSV Export</h2>

          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-5 h-5 border-2 border-nature-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading observations...</span>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-nature-50 p-4">
                  <p className="text-xs text-nature-600 font-medium uppercase tracking-wide">
                    Sightings
                  </p>
                  <p className="text-2xl font-bold text-nature-900 mt-1">{sightingCount}</p>
                </div>
                <div className="rounded-xl bg-nature-50 p-4">
                  <p className="text-xs text-nature-600 font-medium uppercase tracking-wide">
                    Date Range
                  </p>
                  <p className="text-sm font-semibold text-nature-900 mt-1">{dateRange}</p>
                </div>
                <div className="rounded-xl bg-nature-50 p-4">
                  <p className="text-xs text-nature-600 font-medium uppercase tracking-wide">
                    File Name
                  </p>
                  <p className="text-sm font-semibold text-nature-900 mt-1 break-all">
                    {exportFileName}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={exportStatus === 'exporting' || sightingCount === 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportStatus === 'exporting' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export to CSV
                  </>
                )}
              </button>

              {sightingCount === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  No observations available to export.
                </p>
              )}
            </>
          )}

          {/* Confirmation */}
          {exportStatus === 'done' && (
            <div className="rounded-xl bg-nature-100 border border-nature-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-nature-800">
                <svg className="w-5 h-5 text-nature-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Export complete</span>
              </div>
              <div className="text-sm text-nature-700 space-y-1 pl-7">
                <p>
                  <span className="font-medium">Sightings included:</span>{' '}
                  {sightingCount}
                </p>
                <p>
                  <span className="font-medium">Date range:</span>{' '}
                  {dateRange}
                </p>
                <p>
                  <span className="font-medium">File name:</span>{' '}
                  <span className="font-mono text-xs">{exportedFileName}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminExportPage() {
  return (
    <AdminGuard>
      <AdminExportPageContent />
    </AdminGuard>
  );
}
