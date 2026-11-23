/** Importación de archivos como texto (`?raw`), resuelta por Vite en las pruebas. */
declare module '*?raw' {
  const content: string;
  export default content;
}
