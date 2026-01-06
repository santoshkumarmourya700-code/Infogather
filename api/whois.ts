import net from 'net';
import psl from 'psl';
import axios from 'axios';
import middleware from './_common/middleware';

const getBaseDomain = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const parsed = psl.parse(hostname);
    // psl.parse returns an object with 'domain' property which is the registered domain (e.g. google.com)
    // If it fails or returns null/invalid, fall back to hostname
    if (parsed.error || !parsed.domain) return hostname;
    return parsed.domain;
  } catch (e) {
    return url; // Fallback if URL parsing fails
  }
};

const parseWhoisData = (data) => {
  if (data.includes('No match for')) {
    return { error: 'No matches found for domain in internic database' };
  }

  const lines = data.split('\r\n');
  const parsedData = {};

  let lastKey = '';

  for (const line of lines) {
    const index = line.indexOf(':');
    if (index === -1) {
      if (lastKey !== '') {
        parsedData[lastKey] += ' ' + line.trim();
      }
      continue;
    }
    let key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (value.length === 0) continue;
    key = key.replace(/\W+/g, '_');
    lastKey = key;

    parsedData[key] = value;
  }

  return parsedData;
};

const fetchFromInternic = async (hostname) => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port: 43, host: 'whois.internic.net' }, () => {
      client.write(hostname + '\r\n');
    });

    let data = '';
    client.on('data', (chunk) => {
      data += chunk;
    });

    client.on('end', () => {
      try {
        const parsedData = parseWhoisData(data);
        resolve(parsedData);
      } catch (error: any) {
        reject(error);
      }
    });

    client.on('error', (err) => {
      reject(err);
    });
  });
};

const whoisHandler = async (url: any): Promise<any> => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }

  const hostname = getBaseDomain(url);
  if (!hostname) {
    throw new Error('Unable to determine base domain');
  }

  const internicData = await fetchFromInternic(hostname);

  return {
    internicData
  };
};

export const handler = middleware(whoisHandler);
export default handler;

