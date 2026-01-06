import { URL } from 'url';
import followRedirects from 'follow-redirects';
import middleware from './_common/middleware';

const { https } = followRedirects;

const SECURITY_TXT_PATHS: string[] = [
  '/security.txt',
  '/.well-known/security.txt',
];

interface SecurityTxtResult {
  isPresent: boolean;
  foundIn?: string;
  content?: string;
  isPgpSigned?: boolean;
  fields?: Record<string, string>;
}

const parseResult = (result: string): Record<string, string> => {
  let output: Record<string, string> = {};
  let counts: Record<string, number> = {};
  const lines = result.split('\n');
  const regex = /^([^:]+):\s*(.+)$/;
  
  for (const line of lines) {
    if (!line.startsWith("#") && !line.startsWith("-----") && line.trim() !== '') {
      const match = line.match(regex);
      if (match && match.length > 2) {
        let key = match[1].trim();
        const value = match[2].trim();
        if (output.hasOwnProperty(key)) {
          counts[key] = counts[key] ? counts[key] + 1 : 1;
          key += counts[key];
        }
        output[key] = value;
      }
    }
  }
  
  return output;
};

const isPgpSigned = (result: string): boolean => {
  if (result.includes('-----BEGIN PGP SIGNED MESSAGE-----')) {
    return true;
  }
  return false;
};

const securityTxtHandler = async (urlParam: string): Promise<SecurityTxtResult> => {

  let url: URL;
  try {
    url = new URL(urlParam.includes('://') ? urlParam : 'https://' + urlParam);
  } catch (error: any) {
    throw new Error('Invalid URL format');
  }
  url.pathname = '';
  
  for (let path of SECURITY_TXT_PATHS) {
    try {
      const result = await fetchSecurityTxt(url, path);
      if (result && result.includes('<html')) return { isPresent: false };
      if (result) {
        return {
          isPresent: true,
          foundIn: path,
          content: result,
          isPgpSigned: isPgpSigned(result),
          fields: parseResult(result),
        };
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  
  return { isPresent: false };
};

async function fetchSecurityTxt(baseURL: URL, path: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    https.get(url.toString(), (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(data);
        });
      } else {
        resolve(null);
      }
    }).on('error', (err: Error) => {
      reject(err);
    });
  });
}

export const handler = middleware(securityTxtHandler);
export default handler;