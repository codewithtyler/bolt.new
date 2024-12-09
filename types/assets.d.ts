declare module '*.css?url' {
  const url: string;
  export default url;
}

declare module '*.scss?url' {
  const url: string;
  export default url;
}

declare module '@unocss/reset/tailwind-compat.css?url' {
  const url: string;
  export default url;
}

declare module 'remix-island' {
  export function createHead(fn: () => JSX.Element): any;
} 