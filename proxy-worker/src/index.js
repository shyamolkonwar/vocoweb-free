export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. Get the subdomain (e.g., "test-site" from "test-site.laxizen.fun")
        const hostname = url.hostname;

        // Split the hostname by dots
        const parts = hostname.split('.');

        // If we are on the root domain (vocoweb.in) or www, do nothing or redirect
        // Adjust '2' if you have a complex TLD like .co.uk (would be 3)
        if (parts.length <= 2 || parts[0] === 'www') {
            // Optional: Redirect root to your main landing page
            // CHANGE THIS: Replace with your actual landing page URL
            return Response.redirect('https://yourdomain.com', 301);
        }

        // Skip api-dev subdomain (handled by Cloudflare Tunnel)
        if (parts[0] === 'api-dev') {
            // Let it pass through to the tunnel
            return fetch(request);
        }

        const subdomain = parts[0];

        // 2. Construct the Target URL
        // We want to fetch: https://<subdomain>.user-websites.pages.dev/path
        const targetHost = `${subdomain}.user-websites.pages.dev`;
        const targetUrl = new URL(request.url);
        targetUrl.hostname = targetHost;

        // 3. Create a new request to the target
        // We must modify the request to ensure Cloudflare Pages accepts it
        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            redirect: 'manual' // Let the worker handle redirects
        });

        // Important: Pages expects the 'Host' header to match the .pages.dev domain
        proxyRequest.headers.set('Host', targetHost);

        // 4. Fetch the content
        try {
            const response = await fetch(proxyRequest);

            // 5. Return the response to the user
            // We clone the response to modify headers if needed (like security headers)
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });

        } catch (e) {
            // If something goes wrong (e.g., user site doesn't exist)
            return new Response("Site not found or Error connecting to Pages.", { status: 404 });
        }
    },
};
