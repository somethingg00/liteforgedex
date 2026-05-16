// Next.js already declares *.png, *.jpg, *.ico etc. as StaticImageData.
// Add declarations here only for file types NOT covered by next-env.d.ts.

declare module "*.csv" {
  const content: string;
  export default content;
}
