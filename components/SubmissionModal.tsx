'use client';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionModal({ isOpen, onClose }: SubmissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-xl font-bold text-nature-900">Prepare Submission for Province</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
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
              Administrators can export all observations to CSV from the admin page for manual
              submission to provincial databases.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href="https://www2.gov.bc.ca/gov/content/environment/plants-animals-ecosystems/wildlife/wildlife-data-information/submit-wildlife-data-information"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              Go to Official BC Wildlife Submission Page
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button onClick={onClose} className="btn-secondary w-full">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
