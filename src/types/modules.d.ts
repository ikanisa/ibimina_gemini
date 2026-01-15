/// <reference types="vitest" />
/// <reference types="vite/client" />

// PWA virtual module declaration (ambient - no imports at top level)
declare module 'virtual:pwa-register' {
    interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: unknown) => void;
    }

    function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
    export { RegisterSWOptions, registerSW };
}

declare module 'virtual:pwa-register/react' {
    interface RegisterSWOptions {
        immediate?: boolean;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onRegisterError?: (error: unknown) => void;
    }

    function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
        offlineReady: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
    export { RegisterSWOptions, useRegisterSW };
}

// jsPDF module declaration (for dynamic import without full package)
declare module 'jspdf' {
    class jsPDF {
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
        // Drawing methods
        setFillColor(r: number, g: number, b: number): void;
        setDrawColor(r: number, g: number, b: number): void;
        setTextColor(r: number, g: number, b: number): void;
        rect(x: number, y: number, w: number, h: number, style?: string): void;
        roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
        line(x1: number, y1: number, x2: number, y2: number): void;
    }
    export { jsPDF };
}
