declare module 'react' {
  export const StrictMode: (props: { children?: unknown }) => unknown
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void
  export function useRef<T>(initialValue: T | null): { current: T | null }
  export function useState<T>(initialValue: T): [T, (value: T) => void]
  const React: {
    StrictMode: typeof StrictMode
  }
  export default React
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: unknown): void
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown
  export const jsxs: unknown
  export const Fragment: unknown
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any
  }
}
