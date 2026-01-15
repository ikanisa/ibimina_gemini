/// <reference types="vite/client" />

// PWA virtual module declaration
declare module 'virtual:pwa-register' {
    export interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: any) => void;
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'virtual:pwa-register/react' {
    import type { Dispatch, SetStateAction } from 'react';

    export interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: any) => void;
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
        offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
}

// jsPDF module declaration (for dynamic import without full package)
declare module 'jspdf' {
    export class jsPDF {
        constructor(orientation?: 'p' | 'portrait' | 'l' | 'landscape', unit?: string, format?: string | number[]);
        setFontSize(size: number): void;
        setFont(font: string, style?: string): void;
        text(text: string, x: number, y: number, options?: object): void;
        addPage(): void;
        setPage(pageNumber: number): void;
        getNumberOfPages(): number;
        output(type: 'blob'): Blob;
        output(type: 'dataurlstring'): string;
        output(type: 'arraybuffer'): ArrayBuffer;
    }
}
