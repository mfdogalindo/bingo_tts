/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
            colors: {
                background: '#000000',
                foreground: '#FFFFFF',
                accent: '#333333',
            },
            fontFamily: {
                sans: ['system-ui', 'sans-serif'],
            }
        },
	},
	plugins: [],
}
