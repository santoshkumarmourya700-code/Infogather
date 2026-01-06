import url from 'url';
import traceroute from 'traceroute';
import middleware from './_common/middleware';

const traceRouteHandler = async (urlString, context: any): Promise<any> => {
  // Parse the URL and get the hostname
  const urlObject = url.parse(urlString);
  const host = urlObject.hostname;

  if (!host) {
    throw new Error('Invalid URL provided');
  }

  // Traceroute with timeout
  const result = await Promise.race([
    new Promise((resolve, reject) => {
      traceroute.trace(host, (err, hops) => {
        if (err || !hops) {
          reject(err || new Error('No hops found'));
        } else {
          resolve(hops);
        }
      });
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Traceroute timed out')), 8000))
  ]);

  return {
    message: "Traceroute completed!",
    result,
  };
};

export const handler = middleware(traceRouteHandler);
export default handler;
