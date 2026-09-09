# LAUNCH UF — Website

Premium website for LAUNCH UF by Riman Mustafa & William Karlsson.

Includes a premium landing page, GROW (299 kr) and SCALE (499 kr), direct order flow, brand questions, logo upload, and Supabase order storage. No Shopify is used.

## Local preview
Open `index.html` or run `python -m http.server 8080` and visit `http://localhost:8080`.

## Connect real orders
1. Create a free Supabase project.
2. Run `supabase-schema.sql` in Supabase SQL Editor.
3. Copy the project URL and anon key into `config.js`.
4. Reload the site.

Until configured, submitted orders are stored only in browser localStorage for demo/testing.

## Free hosting
Cloudflare Pages supports deploying static HTML directly. Connect the folder/repository to GitHub and deploy it as a static site.
