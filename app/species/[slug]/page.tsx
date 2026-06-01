import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSpecies, getSpeciesBySlug, type SpeciesRecord } from '@/lib/supabase';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const species = await getSpecies();
    return species.map((s: SpeciesRecord) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const species = await getSpeciesBySlug(params.slug);
  if (!species) return { title: 'Species Not Found' };
  return {
    title: `${species.display_name} — Kelowna Wildlife Tracker`,
    description: `Learn about ${species.display_name}, a ${species.rarity.toLowerCase()} ${species.category.toLowerCase()} found in Kelowna, BC.`,
  };
}

export default async function SpeciesPage({ params }: Props) {
  const species = await getSpeciesBySlug(params.slug);
  if (!species) notFound();

  const hasThumbnail = !!species.thumbnail_url;
  const hasWikipedia = !!species.wikipedia_url;

  return (
    <main className="min-h-screen bg-nature-50">
      {/* Header */}
      <header className="bg-nature-800 text-white px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">Kelowna Wildlife Tracker</Link>
        <Link href="/admin/species" className="text-sm text-nature-200 hover:text-white transition-colors">
          Species Admin
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-nature-700 hover:text-nature-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Map
        </Link>

        {/* Species Card */}
        <div className="rounded-2xl border border-nature-200 bg-white shadow-sm overflow-hidden">
          {/* Thumbnail */}
          <div className="w-full h-64 sm:h-80 bg-gray-100 flex items-center justify-center">
            {hasThumbnail ? (
              <img
                src={species.thumbnail_url!}
                alt={species.display_name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-nature-100 flex items-center justify-center mb-3">
                  <svg className="w-10 h-10 text-nature-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-nature-500">{species.category} Placeholder</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  species.category === 'Bird'
                    ? 'bg-sky-100 text-sky-800'
                    : species.category === 'Mammal'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {species.category}
              </span>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  species.rarity === 'Common'
                    ? 'bg-nature-100 text-nature-800'
                    : 'bg-earth-100 text-earth-800'
                }`}
              >
                {species.rarity}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-nature-900">{species.display_name}</h1>

            <div className="mt-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Observation Count</h2>
                <p className="text-lg font-medium text-nature-800 mt-1">
                  {species.observation_count} sighting{species.observation_count !== 1 ? 's' : ''} recorded
                </p>
              </div>

              {hasWikipedia && (
                <a
                  href={species.wikipedia_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 btn-secondary py-2.5 px-4 text-base"
                >
                  Learn More on Wikipedia
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
