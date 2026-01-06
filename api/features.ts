import https from 'https';
import middleware from './_common/middleware';

const featuresHandler = async (url: any): Promise<any> => {
  const apiKey = process.env.BUILT_WITH_API_KEY;

  if (!url) {
    throw new Error('URL query parameter is required');
  }

  if (!apiKey) {
    throw new Error('Missing BuiltWith API key in environment variables');
  }

  const apiUrl = `https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${encodeURIComponent(url)}`;

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(apiUrl, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode <= 299) {
            resolve(data);
          } else {
            reject(new Error(`Request failed with status code: ${res.statusCode}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.end();
    });

    return response;
  } catch (error: any) {
    throw new Error(`Error making request: ${error.message}`);
  }
};

export const handler = middleware(featuresHandler);
export default handler;
