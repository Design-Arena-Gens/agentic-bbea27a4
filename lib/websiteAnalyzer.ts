import axios from 'axios';
import * as cheerio from 'cheerio';

interface WebsiteAnalysis {
  status: 'No Website' | 'Low Quality' | 'Good Quality';
  score: number;
  issues: string[];
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  if (!url || url === '') {
    return {
      status: 'No Website',
      score: 0,
      issues: ['No website found'],
    };
  }

  try {
    // Fetch website with timeout
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status >= 400) {
      return {
        status: 'Low Quality',
        score: 20,
        issues: ['Website not accessible', `HTTP ${response.status}`],
      };
    }

    const $ = cheerio.load(response.data);
    const issues: string[] = [];
    let score = 100;

    // Check for mobile responsiveness
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) {
      issues.push('Not mobile-responsive');
      score -= 15;
    }

    // Check for HTTPS
    if (!url.startsWith('https://')) {
      issues.push('No HTTPS');
      score -= 10;
    }

    // Check for title
    const title = $('title').text();
    if (!title || title.length < 10) {
      issues.push('Missing or poor title tag');
      score -= 10;
    }

    // Check for meta description
    const description = $('meta[name="description"]').attr('content');
    if (!description || description.length < 50) {
      issues.push('Missing or poor meta description');
      score -= 10;
    }

    // Check for images with alt text
    const images = $('img');
    let imagesWithoutAlt = 0;
    images.each((_, img) => {
      if (!$(img).attr('alt')) {
        imagesWithoutAlt++;
      }
    });
    if (images.length > 0 && imagesWithoutAlt / images.length > 0.5) {
      issues.push('Many images missing alt text');
      score -= 8;
    }

    // Check for contact information
    const bodyText = $('body').text().toLowerCase();
    const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(bodyText);
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(bodyText);

    if (!hasPhone && !hasEmail) {
      issues.push('No contact information visible');
      score -= 15;
    }

    // Check for outdated design indicators
    const hasFlash = $('object[type*="flash"]').length > 0 || $('embed[type*="flash"]').length > 0;
    if (hasFlash) {
      issues.push('Uses outdated Flash technology');
      score -= 20;
    }

    // Check for excessive tables (old-school layout)
    const tables = $('table');
    if (tables.length > 10) {
      issues.push('Outdated table-based layout');
      score -= 15;
    }

    // Check for social media links
    const hasSocialLinks = $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="linkedin.com"]').length > 0;
    if (!hasSocialLinks) {
      issues.push('No social media integration');
      score -= 5;
    }

    // Check page load size (simplified check based on HTML size)
    const htmlSize = response.data.length;
    if (htmlSize > 500000) {
      issues.push('Large page size (slow loading)');
      score -= 10;
    }

    // Check for broken links (sample check)
    const links = $('a[href]');
    let brokenLinksEstimate = 0;
    if (links.length > 0) {
      // Sample check for obviously broken links
      links.slice(0, 10).each((_, link) => {
        const href = $(link).attr('href');
        if (href === '#' || href === '' || href === 'javascript:void(0)') {
          brokenLinksEstimate++;
        }
      });
      if (brokenLinksEstimate > 3) {
        issues.push('Multiple broken links detected');
        score -= 8;
      }
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine status based on score
    let status: 'No Website' | 'Low Quality' | 'Good Quality';
    if (score >= 70) {
      status = 'Good Quality';
    } else if (score >= 40) {
      status = 'Low Quality';
    } else {
      status = 'Low Quality';
    }

    return {
      status,
      score,
      issues: issues.length > 0 ? issues : ['No major issues detected'],
    };
  } catch (error: any) {
    // Network error, timeout, or other issues
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        status: 'No Website',
        score: 0,
        issues: ['Website not accessible or does not exist'],
      };
    }

    return {
      status: 'Low Quality',
      score: 15,
      issues: ['Unable to analyze website', error.message || 'Unknown error'],
    };
  }
}
