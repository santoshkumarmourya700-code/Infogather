import net from 'net';
import middleware from './_common/middleware';

// A list of commonly used ports.
const DEFAULT_PORTS_TO_CHECK = [
  20, 21, 22, 23, 25, 53, 80, 67, 68, 69,
  110, 119, 123, 143, 156, 161, 162, 179, 194,
  389, 443, 587, 993, 995,
  3000, 3306, 3389, 5060, 5900, 8000, 8080, 8888
];
/*
 * Checks if the env PORTS_TO_CHECK is set, if so the string is split via "," to get an array of ports to check.
 * If the env is not set, return the default commonly used ports.
 */
const PORTS = process.env.PORTS_TO_CHECK ? process.env.PORTS_TO_CHECK.split(",") : DEFAULT_PORTS_TO_CHECK

async function checkPort(port, domain) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(1500);

        socket.once('connect', () => {
            socket.destroy();
            resolve(port);
        });

        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error(`Timeout at port: ${port}`));
        });

        socket.once('error', (e) => {
            socket.destroy();
            reject(e);
        });
        
        socket.connect(port, domain);
    });
}

const portsHandler = async (url, event, context: any): Promise<any> => {
  const domain = url.replace(/(^\w+:|^)\/\//, '');
  
  const openPorts = [];
  const failedPorts = [];

  const promises = PORTS.map(port => checkPort(port, domain)
    .then(() => {
      openPorts.push(port);
    })
    .catch(() => {
      failedPorts.push(port);
    }));

  // Limit total time for port scanning to 8 seconds
  await Promise.race([
    Promise.allSettled(promises),
    new Promise(resolve => setTimeout(resolve, 8000))
  ]);

  // If some ports didn't finish, consider them failed
  const checkedPorts = new Set([...openPorts, ...failedPorts]);
  PORTS.forEach(port => {
    if (!checkedPorts.has(port)) {
      failedPorts.push(port);
    }
  });
  
  // Sort openPorts and failedPorts before returning
  openPorts.sort((a, b) => a - b);
  failedPorts.sort((a, b) => a - b);
  
  return { openPorts, failedPorts };
};

export const handler = middleware(portsHandler);
export default handler;
