import { NextRequest } from 'next/server';
import { searchBusinesses } from '@/lib/searchEngine';
import { analyzeWebsite } from '@/lib/websiteAnalyzer';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface SearchParams {
  city: string;
  state: string;
  country: string;
  category: string;
  leadCount: number;
}

export async function POST(req: NextRequest) {
  const searchParams: SearchParams = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendMessage = (type: string, data: any) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
          );
        };

        sendMessage('progress', { message: 'Starting business search...' });

        // Search for businesses
        const businesses = await searchBusinesses(searchParams, (progress) => {
          sendMessage('progress', { message: progress });
        });

        sendMessage('progress', {
          message: `Found ${businesses.length} businesses. Analyzing websites...`,
        });

        // Analyze each business
        for (let i = 0; i < businesses.length; i++) {
          const business = businesses[i];
          sendMessage('progress', {
            message: `Analyzing ${business.businessName} (${i + 1}/${businesses.length})`,
          });

          const websiteAnalysis = await analyzeWebsite(business.website);

          const lead = {
            ...business,
            websiteStatus: websiteAnalysis.status,
            qualityScore: websiteAnalysis.score,
            issues: websiteAnalysis.issues,
          };

          sendMessage('result', { lead });

          // Small delay to prevent overwhelming the client
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        sendMessage('complete', { message: 'Search completed successfully' });
        controller.close();
      } catch (error) {
        console.error('Search error:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'An error occurred during search',
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
