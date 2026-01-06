import https from 'https';
import middleware from './_common/middleware';

const dnsSecHandler = async (domain: any): Promise<any> => {
  const dnsTypes = ['DNSKEY', 'DS', 'RRSIG'];
  const records = {};

  for (const type of dnsTypes) {
    const options = {
      hostname: 'dns.google',
      path: `/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json'
      }
    };

    try {
      const dnsResponse = await new Promise((resolve, reject) => {
        const req = https.request(options, res => {
          let data = '';
          
          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error: any) {
              reject(new Error('Invalid JSON response'));
            }
          });

          res.on('error', error => {
            reject(error);
          });
        });

        req.end();
      });

      if (dnsResponse.Answer) {
        records[type] = { isFound: true, answer: dnsResponse.Answer, response: dnsResponse.Answer };
      } else {
        records[type] = { isFound: false, answer: null, response: dnsResponse };
      }
    } catch (error: any) {
      throw new Error(`Error fetching ${type} record: ${error.message}`); // This will be caught and handled by the commonMiddleware
    }
  }

  return records;
};

export const handler = middleware(dnsSecHandler);
export default handler;
