import https from 'https';
import { performance, PerformanceObserver } from 'perf_hooks';
import middleware from './_common/middleware';

const statusHandler = async (url: any): Promise<any> => {
  if (!url) {
    throw new Error('You must provide a URL query parameter!');
  }

  let dnsLookupTime;
  let responseCode;
  let startTime;

  const obs = new PerformanceObserver((items) => {
    dnsLookupTime = items.getEntries()[0].duration;
    performance.clearMarks();
  });

  obs.observe({ entryTypes: ['measure'] });

  performance.mark('A');

  try {
    startTime = performance.now();
    const response = await new Promise((resolve, reject) => {
      const req = https.get(url, res => {
        let data = '';
        responseCode = res.statusCode;
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(res);
        });
      });

      req.on('error', reject);
      req.end();
    });

    if (responseCode < 200 || responseCode >= 400) {
      throw new Error(`Received non-success response code: ${responseCode}`);
    }

    performance.mark('B');
    performance.measure('A to B', 'A', 'B');
    let responseTime = performance.now() - startTime;
    obs.disconnect();

    return { isUp: true, dnsLookupTime, responseTime, responseCode };

  } catch (error: any) {
    obs.disconnect();
    throw error;
  }
};

export const handler = middleware(statusHandler);
export default handler;
