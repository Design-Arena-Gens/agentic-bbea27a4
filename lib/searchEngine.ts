import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchParams {
  city: string;
  state: string;
  country: string;
  category: string;
  leadCount: number;
}

interface Business {
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
}

export async function searchBusinesses(
  params: SearchParams,
  onProgress: (message: string) => void
): Promise<Business[]> {
  const businesses: Business[] = [];
  const { city, state, country, category, leadCount } = params;

  // Simulate searching across multiple platforms
  // In a real implementation, you would use actual APIs or web scraping

  onProgress('Searching Google Maps...');
  const googleResults = await searchGoogleMaps(city, state, country, category, Math.ceil(leadCount / 3));
  businesses.push(...googleResults);

  onProgress('Searching local directories...');
  const directoryResults = await searchLocalDirectories(city, state, country, category, Math.ceil(leadCount / 3));
  businesses.push(...directoryResults);

  onProgress('Searching social media platforms...');
  const socialResults = await searchSocialMedia(city, state, country, category, Math.ceil(leadCount / 3));
  businesses.push(...socialResults);

  // Remove duplicates and limit to requested count
  const uniqueBusinesses = removeDuplicates(businesses);
  return uniqueBusinesses.slice(0, leadCount);
}

async function searchGoogleMaps(
  city: string,
  state: string,
  country: string,
  category: string,
  limit: number
): Promise<Business[]> {
  // Simulated Google Maps search results
  // In production, use Google Places API or scraping with proper authorization

  const mockBusinesses: Business[] = [];
  const location = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;

  for (let i = 0; i < limit; i++) {
    mockBusinesses.push({
      businessName: `${category} ${i + 1} - ${city}`,
      address: `${Math.floor(Math.random() * 999) + 1} Main Street, ${location}`,
      phone: `+${Math.floor(Math.random() * 900000000) + 100000000}`,
      email: Math.random() > 0.5 ? `contact${i}@${category.toLowerCase().replace(/\s/g, '')}${i}.com` : '',
      socialMedia: {
        facebook: Math.random() > 0.3 ? `https://facebook.com/${category.toLowerCase().replace(/\s/g, '')}${i}` : undefined,
        instagram: Math.random() > 0.4 ? `https://instagram.com/${category.toLowerCase().replace(/\s/g, '')}${i}` : undefined,
      },
      website: Math.random() > 0.4 ? `https://${category.toLowerCase().replace(/\s/g, '')}${i}.com` : '',
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${category} ${city} ${country}`)}`,
      category: category,
    });
  }

  return mockBusinesses;
}

async function searchLocalDirectories(
  city: string,
  state: string,
  country: string,
  category: string,
  limit: number
): Promise<Business[]> {
  // Simulated directory search (JustDial, IndiaMART, etc.)
  const mockBusinesses: Business[] = [];
  const location = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;

  for (let i = 0; i < limit; i++) {
    const hasWebsite = Math.random() > 0.6;
    mockBusinesses.push({
      businessName: `${category} Business ${i + 100} - ${city}`,
      address: `${Math.floor(Math.random() * 999) + 1} ${['Park', 'Market', 'Plaza', 'Avenue'][Math.floor(Math.random() * 4)]} Road, ${location}`,
      phone: `+${Math.floor(Math.random() * 900000000) + 100000000}`,
      email: Math.random() > 0.6 ? `info${i}@${category.toLowerCase().replace(/\s/g, '')}${i + 100}.com` : '',
      socialMedia: {
        facebook: Math.random() > 0.5 ? `https://facebook.com/${category.toLowerCase().replace(/\s/g, '')}${i + 100}` : undefined,
        instagram: Math.random() > 0.6 ? `https://instagram.com/${category.toLowerCase().replace(/\s/g, '')}${i + 100}` : undefined,
      },
      website: hasWebsite ? `https://www.${category.toLowerCase().replace(/\s/g, '')}${i + 100}.com` : '',
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${category} ${city} ${country}`)}`,
      category: category,
    });
  }

  return mockBusinesses;
}

async function searchSocialMedia(
  city: string,
  state: string,
  country: string,
  category: string,
  limit: number
): Promise<Business[]> {
  // Simulated social media search
  const mockBusinesses: Business[] = [];
  const location = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;

  for (let i = 0; i < limit; i++) {
    const hasWebsite = Math.random() > 0.7;
    mockBusinesses.push({
      businessName: `${city} ${category} ${i + 200}`,
      address: `${location}`,
      phone: `+${Math.floor(Math.random() * 900000000) + 100000000}`,
      email: Math.random() > 0.7 ? `contact${i + 200}@gmail.com` : '',
      socialMedia: {
        facebook: `https://facebook.com/${category.toLowerCase().replace(/\s/g, '')}${i + 200}`,
        instagram: Math.random() > 0.3 ? `https://instagram.com/${category.toLowerCase().replace(/\s/g, '')}${i + 200}` : undefined,
      },
      website: hasWebsite ? `https://${category.toLowerCase().replace(/\s/g, '')}${i + 200}.com` : '',
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${category} ${city} ${country}`)}`,
      category: category,
    });
  }

  return mockBusinesses;
}

function removeDuplicates(businesses: Business[]): Business[] {
  const seen = new Set<string>();
  return businesses.filter((business) => {
    const key = `${business.businessName.toLowerCase()}-${business.phone}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
