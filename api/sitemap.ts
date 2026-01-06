import axios from 'axios';
import xml2js from 'xml2js';
import middleware from './_common/middleware';

const sitemapHandler = async (url: any): Promise<any> => {
  const hardTimeOut = 5000;
  
  // Normalize base URL
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  const possibleLocations = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap.php`,
    `${baseUrl}/sitemap.txt`,
  ];

  try {
    // 1. Try to find sitemap in robots.txt first as it's the most reliable source
    try {
      const robotsRes = await axios.get(`${baseUrl}/robots.txt`, { timeout: hardTimeOut });
      const robotsTxt = robotsRes.data.split('\n');
      for (let line of robotsTxt) {
        if (line.toLowerCase().startsWith('sitemap:')) {
          const foundUrl = line.split(':').slice(1).join(':').trim();
          if (foundUrl) possibleLocations.unshift(foundUrl); // Put at front
        }
      }
    } catch (e) {
      // robots.txt missing or failed, ignore and continue with defaults
    }

    // 2. Try locations until one works
    let sitemapData = null;
    let sitemapUrlUsed = '';

    for (const loc of [...new Set(possibleLocations)]) {
      try {
        const res = await axios.get(loc, { timeout: hardTimeOut });
        if (res.status === 200) {
          sitemapData = res.data;
          sitemapUrlUsed = loc;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!sitemapData) {
      return { skipped: 'No sitemap found at common locations or in robots.txt' };
    }

    // 3. Parse based on content type/extension
    if (sitemapUrlUsed.endsWith('.txt') || (typeof sitemapData === 'string' && !sitemapData.trim().startsWith('<'))) {
      return { urls: sitemapData.split('\n').filter((l: string) => l.trim().startsWith('http')) };
    }

    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const parsed = await parser.parseStringPromise(sitemapData);
      return parsed;
    } catch (parseError) {
      return { raw: sitemapData.substring(0, 1000) + '...' };
    }

  } catch (error: any) {
    return { error: error.message };
  }
};

export const handler = middleware(sitemapHandler);
export default handler;
