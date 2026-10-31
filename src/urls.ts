/** Public assets must stay inside the deployed GitHub Pages project directory. */
export function publicUrl(path:string,base=import.meta.env?.BASE_URL??'/') {
 return `${base}${path.replace(/^\/+/, '')}`;
}
