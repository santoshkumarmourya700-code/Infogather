import { Resolver } from 'dns/promises';
import middleware from './_common/middleware';

const txtRecordHandler = async (url, event, context: any): Promise<any> => {
  try {
    let hostname = url;
    if (hostname.startsWith('http')) {
      hostname = new URL(url).hostname;
    }
    
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    
    // Set a timeout for the DNS query
    const txtRecords = await Promise.race([
      resolver.resolveTxt(hostname),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS query timed out')), 5000))
    ]) as string[][];

    if (!txtRecords || txtRecords.length === 0) {
      return { skipped: 'No TXT records found' };
    }

    // Parsing and formatting TXT records into a single object
    const readableTxtRecords = txtRecords.reduce((acc, recordArray) => {
      const recordObject = recordArray.reduce((recordAcc, recordString) => {
        const splitRecord = recordString.split('=');
        const key = splitRecord[0];
        const value = splitRecord.slice(1).join('=');
        return { ...recordAcc, [key]: value || true };
      }, {});
      return { ...acc, ...recordObject };
    }, {});

    return readableTxtRecords;

  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return { skipped: 'No TXT records found' };
    }
    return { error: error.message };
  }
};

export const handler = middleware(txtRecordHandler);
export default handler;
