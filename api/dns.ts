import { Resolver } from 'dns/promises';
import middleware from './_common/middleware';

interface DnsResult {
  A: any;
  AAAA: any;
  MX: any;
  TXT: any;
  NS: any;
  CNAME: any;
  SOA: any;
  SRV: any;
  PTR: any;
}

const dnsHandler = async (url: string): Promise<DnsResult> => {
  let hostname = url;
  if (hostname.startsWith('http')) {
    hostname = new URL(hostname).hostname;
  }

  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  const safeResolve = async (fn: any) => {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
    } catch {
      return [];
    }
  };

  const [a, aaaa, mx, txt, ns, cname, soa, srv, ptr] = await Promise.all([
    safeResolve(() => resolver.resolve4(hostname)),
    safeResolve(() => resolver.resolve6(hostname)),
    safeResolve(() => resolver.resolveMx(hostname)),
    safeResolve(() => resolver.resolveTxt(hostname)),
    safeResolve(() => resolver.resolveNs(hostname)),
    safeResolve(() => resolver.resolveCname(hostname)),
    safeResolve(() => resolver.resolveSoa(hostname)),
    safeResolve(() => resolver.resolveSrv(hostname)),
    safeResolve(() => resolver.resolvePtr(hostname))
  ]);

  return {
    A: a,
    AAAA: aaaa,
    MX: mx,
    TXT: txt,
    NS: ns,
    CNAME: cname,
    SOA: soa,
    SRV: srv,
    PTR: ptr
  };
};

export const handler = middleware(dnsHandler);
export default handler;
