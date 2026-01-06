import { promises as dnsPromises } from 'dns';
import axios from 'axios';
import middleware from './_common/middleware';

const dnsServerHandler = async (url: any): Promise<any> => {
  try {
    let hostname = url;
    if (hostname.startsWith('http')) {
      hostname = new URL(url).hostname;
    } else {
      // Handle cases like "example.com/"
      hostname = hostname.split('/')[0];
    }

    const addresses = await dnsPromises.resolve4(hostname).catch(() => []);
    
    if (addresses.length === 0) {
      return { skipped: `No A records found for ${hostname}` };
    }

    const results = await Promise.all(addresses.map(async (address) => {
      const reverseHostnames = await dnsPromises.reverse(address).catch(() => null);
      let dohDirectSupports = false;
      try {
        // Very short timeout for DoH check to avoid hanging
        await axios.get(`https://${address}/dns-query`, { timeout: 2000 });
        dohDirectSupports = true;
      } catch (error: any) {
        dohDirectSupports = false;
      }
      return {
        address,
        hostname: reverseHostnames ? reverseHostnames[0] : null,
        dohDirectSupports,
      };
    }));

    return {
      domain: hostname,
      dns: results,
    };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const handler = middleware(dnsServerHandler);
export default handler;
