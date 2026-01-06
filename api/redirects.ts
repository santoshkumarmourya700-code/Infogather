import got from 'got';
import middleware from './_common/middleware';

const redirectsHandler = async (url: any): Promise<any> => {
  const redirects = [url];
  try {
    await got(url, {
      followRedirect: true,
      maxRedirects: 12,
      hooks: {
        beforeRedirect: [
          (options, response) => {
            redirects.push(response.headers.location);
          },
        ],
      },
    });

    return {
      redirects: redirects,
    };
  } catch (error: any) {
    throw new Error(`Error: ${error.message}`);
  }
};

export const handler = middleware(redirectsHandler);
export default handler;
