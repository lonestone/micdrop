export function getCanonicalPath(pathname: string): string {
  return pathname.replace(/index\.html$/, '').replace(/\.html$/, '')
}
