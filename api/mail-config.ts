import { Resolver } from 'dns/promises';
import middleware from './_common/middleware';

const mailConfigHandler = async (url, event, context: any): Promise<any> => {
  try {
    let hostname = url;
    if (hostname.startsWith('http')) {
      hostname = new URL(url).hostname;
    }

    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    const safeResolve = async (fn: () => Promise<any>) => {
      try {
        return await Promise.race([
          fn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000))
        ]);
      } catch {
        return [];
      }
    };

    // Get records in parallel
    const [mxRecords, txtRecords] = await Promise.all([
      safeResolve(() => resolver.resolveMx(hostname)),
      safeResolve(() => resolver.resolveTxt(hostname))
    ]);

    // Filter for only email related TXT records
    const emailTxtRecords = (txtRecords as string[][]).filter(record => {
      const recordString = record.join('');
      const lower = recordString.toLowerCase();
      return (
        lower.startsWith('v=spf1') ||
        lower.startsWith('v=dkim1') ||
        lower.startsWith('v=dmarc1') ||
        lower.includes('google-site-verification') ||
        lower.includes('ms=') ||
        lower.includes('protonmail-verification') ||
        lower.includes('zoho-verification')
      );
    });

    // Identify mail services
    const mailServices: any[] = [];
    
    // Check MX records
    mxRecords.forEach((record: any) => {
      const ex = record.exchange.toLowerCase();
      if (ex.includes('google.com') || ex.includes('googlemail.com')) mailServices.push({ provider: 'Google Workspace', value: record.exchange });
      if (ex.includes('outlook.com')) mailServices.push({ provider: 'Microsoft 365', value: record.exchange });
      if (ex.includes('protonmail.ch')) mailServices.push({ provider: 'ProtonMail', value: record.exchange });
      if (ex.includes('yahoodns.net')) mailServices.push({ provider: 'Yahoo Mail', value: record.exchange });
      if (ex.includes('zoho.com')) mailServices.push({ provider: 'Zoho Mail', value: record.exchange });
    });

    return {
      mxRecords,
      txtRecords: emailTxtRecords,
      mailServices: [...new Set(mailServices.map(s => JSON.stringify(s)))].map(s => JSON.parse(s)),
    };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const handler = middleware(mailConfigHandler);
export default handler;
