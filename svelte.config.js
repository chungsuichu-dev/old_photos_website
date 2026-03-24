//import adapter from '@sveltejs/adapter-cloudflare';

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
    	adapter: adapter({
      		fallback: 'index.html'
    	}),
    	paths: {
  			base: process.env.NODE_ENV === 'production' ? '/old_photos_website' : ''
		}

  	},
	preprocess: vitePreprocess(),
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
