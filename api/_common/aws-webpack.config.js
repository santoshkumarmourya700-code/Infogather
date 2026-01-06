const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: {
        'carbon': './api/carbon.ts',
        'cookies': './api/cookies.ts',
        'dns-server': './api/dns-server.ts',
        'dns': './api/dns.ts',
        'dnssec': './api/dnssec.ts',
        'features': './api/features.ts',
        'get-ip': './api/get-ip.ts',
        'headers': './api/headers.ts',
        'hsts': './api/hsts.ts',
        'linked-pages': './api/linked-pages.ts',
        'mail-config': './api/mail-config.ts',
        'ports': './api/ports.ts',
        'quality': './api/quality.ts',
        'redirects': './api/redirects.ts',
        'robots-txt': './api/robots-txt.ts',
        'screenshot': './api/screenshot.ts',
        'security-txt': './api/security-txt.ts',
        'sitemap': './api/sitemap.ts',
        'social-tags': './api/social-tags.ts',
        'ssl': './api/ssl.ts',
        'status': './api/status.ts',
        'tech-stack': './api/tech-stack.ts',
        'trace-route': './api/trace-route.ts',
        'txt-records': './api/txt-records.ts',
        'whois': './api/whois.ts',
    },
    externals: [nodeExternals()],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '.webpack'),
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader'
                },
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
};
