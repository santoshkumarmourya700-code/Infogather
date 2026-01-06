import tls from 'tls';
import middleware from './_common/middleware';

const tlsHandler = async (urlString: string): Promise<any> => {
  try {
    if (!urlString.startsWith('http')) {
      urlString = `https://${urlString}`;
    }
    const parsedUrl = new URL(urlString);
    const options = {
      host: parsedUrl.hostname,
      port: 443,
      servername: parsedUrl.hostname,
      rejectUnauthorized: false,
    };

    return new Promise((resolve, reject) => {
      const socket = tls.connect(options, () => {
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        const ephemeral = socket.getEphemeralKeyInfo();
        
        resolve({
          protocol,
          cipher: cipher.name,
          cipherVersion: cipher.version,
          ephemeral,
          authorized: socket.authorized,
          authorizationError: socket.authorizationError
        });
        socket.end();
      });

      socket.on('error', (error: any) => {
        reject(new Error(error.message || 'Connection failed'));
      });
      
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('TLS connection timed out'));
      });
    });
  } catch (error: any) {
    return { error: error.message };
  }
};

export const handler = middleware(tlsHandler);
export default handler;
