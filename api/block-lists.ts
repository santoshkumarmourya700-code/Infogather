import { Resolver } from 'dns/promises';
import { URL } from 'url';
import middleware from './_common/middleware';

const DNS_SERVERS = [
  { name: 'AdGuard', ip: '94.140.14.14' },
  { name: 'AdGuard Family', ip: '94.140.14.15' },
  { name: 'CleanBrowsing Adult', ip: '185.228.168.10' },
  { name: 'CleanBrowsing Family', ip: '185.228.168.168' },
  { name: 'CleanBrowsing Security', ip: '185.228.168.9' },
  { name: 'CloudFlare', ip: '1.1.1.1' },
  { name: 'CloudFlare Family', ip: '1.1.1.3' },
  { name: 'Comodo Secure', ip: '8.26.56.26' },
  { name: 'Google DNS', ip: '8.8.8.8' },
  { name: 'Neustar Family', ip: '156.154.70.3' },
  { name: 'Neustar Protection', ip: '156.154.70.2' },
  { name: 'Norton Family', ip: '199.85.126.20' },
  { name: 'OpenDNS', ip: '208.67.222.222' },
  { name: 'OpenDNS Family', ip: '208.67.222.123' },
  { name: 'Quad9', ip: '9.9.9.9' },
  { name: 'Yandex Family', ip: '77.88.8.7' },
  { name: 'Yandex Safe', ip: '77.88.8.88' },
];

const knownBlockIPs = [
  '146.112.61.106', '185.228.168.10', '8.26.56.26', '9.9.9.9',
  '208.69.38.170', '208.69.39.170', '208.67.222.222', '208.67.222.123',
  '199.85.126.10', '199.85.126.20', '156.154.70.22', '77.88.8.7', '77.88.8.8',
  '127.0.0.1', '0.0.0.0', '::1'
];

const checkDomainWithServer = async (domain: string, serverIP: string) => {
  const resolver = new Resolver();
  try {
    resolver.setServers([serverIP]);
    const addresses = await Promise.race([
      resolver.resolve4(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]) as string[];
    
    return addresses.some(addr => knownBlockIPs.includes(addr));
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.code === 'SERVFAIL' || err.message === 'Timeout') {
      return true; // Often block implies non-resolvable or timeout
    }
    return false;
  }
};

const blockListHandler = async (url: any): Promise<any> => {
  const domain = new URL(url).hostname;
  
  const results = await Promise.all(DNS_SERVERS.map(async (server) => {
    const isBlocked = await checkDomainWithServer(domain, server.ip);
    return {
      server: server.name,
      isBlocked,
    };
  }));

  return { blocklists: results };
};

export const handler = middleware(blockListHandler);
export default handler;
