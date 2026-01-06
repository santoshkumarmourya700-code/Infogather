const Wappalyzer = require('wappalyzer');
import middleware from './_common/middleware';

const techStackHandler = async (url: any): Promise<any> => {
  const options = {};

  const wappalyzer = new Wappalyzer(options);

  try {
    await wappalyzer.init();
    const headers = {};
    const storage = {
      local: {},
      session: {},
    };
    const site = await wappalyzer.open(url, headers, storage);
    const results = await site.analyze();

    if (!results.technologies || results.technologies.length === 0) {
      throw new Error('Unable to find any technologies for site');
    }
    return results;
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
    await wappalyzer.destroy();
  }
};

export const handler = middleware(techStackHandler);
export default handler;
