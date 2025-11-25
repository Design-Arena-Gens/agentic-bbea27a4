'use client';

import { useState } from 'react';

interface SearchParams {
  city: string;
  state: string;
  country: string;
  category: string;
  leadCount: number;
}

interface Lead {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
  };
  website: string;
  googleMapsUrl: string;
  category: string;
  websiteStatus: 'No Website' | 'Low Quality' | 'Good Quality';
  qualityScore: number;
  issues: string[];
}

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: '',
    state: '',
    country: '',
    category: '',
    leadCount: 10,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [progress, setProgress] = useState('');

  const categories = [
    'Restaurant',
    'Salon',
    'Gym',
    'Boutique',
    'Coaching Classes',
    'Cafe',
    'Spa',
    'Dental Clinic',
    'Law Firm',
    'Real Estate',
    'Auto Repair',
    'Pet Store',
    'Bakery',
    'Florist',
    'Plumber',
    'Electrician',
  ];

  const handleSearch = async () => {
    if (!searchParams.city || !searchParams.country || !searchParams.category) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress('Initializing search...');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'progress') {
              setProgress(data.message);
            } else if (data.type === 'result') {
              setResults((prev) => [...prev, data.lead]);
            } else if (data.type === 'complete') {
              setProgress('Search complete!');
            }
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setProgress('Error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = [
      'Business Name',
      'Address',
      'Phone',
      'Email',
      'Website',
      'Facebook',
      'Instagram',
      'Google Maps URL',
      'Category',
      'Website Status',
      'Quality Score',
      'Issues',
    ];

    const rows = results.map((lead) => [
      lead.businessName,
      lead.address,
      lead.phone,
      lead.email,
      lead.website,
      lead.socialMedia.facebook || '',
      lead.socialMedia.instagram || '',
      lead.googleMapsUrl,
      lead.category,
      lead.websiteStatus,
      lead.qualityScore,
      lead.issues.join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${searchParams.city}_${searchParams.category}_${new Date().getTime()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Website Opportunity Finder AI
          </h1>
          <p className="text-gray-600">
            Find businesses without websites or with low-quality websites
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Search Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={searchParams.city}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, city: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="e.g., Mumbai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={searchParams.state}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, state: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="e.g., Maharashtra"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={searchParams.country}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, country: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                placeholder="e.g., India"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Category *
              </label>
              <select
                value={searchParams.category}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Leads
              </label>
              <input
                type="number"
                value={searchParams.leadCount}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    leadCount: parseInt(e.target.value) || 10,
                  })
                }
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Start Search'}
          </button>

          {progress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">{progress}</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Results ({results.length} leads)
              </h2>
              <button
                onClick={downloadCSV}
                className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Download CSV
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {results.map((lead, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {lead.businessName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.websiteStatus === 'No Website'
                          ? 'bg-red-100 text-red-800'
                          : lead.websiteStatus === 'Low Quality'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {lead.websiteStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <strong>Address:</strong> {lead.address}
                    </div>
                    <div>
                      <strong>Phone:</strong> {lead.phone}
                    </div>
                    {lead.email && (
                      <div>
                        <strong>Email:</strong> {lead.email}
                      </div>
                    )}
                    <div>
                      <strong>Category:</strong> {lead.category}
                    </div>
                    {lead.website && (
                      <div className="md:col-span-2">
                        <strong>Website:</strong>{' '}
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {lead.website}
                        </a>
                      </div>
                    )}
                    {(lead.socialMedia.facebook || lead.socialMedia.instagram) && (
                      <div className="md:col-span-2">
                        <strong>Social Media:</strong>{' '}
                        {lead.socialMedia.facebook && (
                          <a
                            href={lead.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mr-3"
                          >
                            Facebook
                          </a>
                        )}
                        {lead.socialMedia.instagram && (
                          <a
                            href={lead.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Instagram
                          </a>
                        )}
                      </div>
                    )}
                    {lead.googleMapsUrl && (
                      <div className="md:col-span-2">
                        <strong>Google Maps:</strong>{' '}
                        <a
                          href={lead.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on Maps
                        </a>
                      </div>
                    )}
                  </div>

                  {lead.websiteStatus !== 'No Website' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <strong className="text-sm text-gray-700">
                          Quality Score:
                        </strong>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              lead.qualityScore >= 70
                                ? 'bg-green-500'
                                : lead.qualityScore >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${lead.qualityScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {lead.qualityScore}%
                        </span>
                      </div>
                      {lead.issues.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <strong>Issues:</strong> {lead.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
