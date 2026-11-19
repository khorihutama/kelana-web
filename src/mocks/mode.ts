const mode = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock';

export const isMock = () => mode !== 'real';
export const isReal = () => mode === 'real';