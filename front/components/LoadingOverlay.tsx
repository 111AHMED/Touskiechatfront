'use client';

interface LoadingOverlayProps {
    isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-3 transform scale-100 transition-all duration-300 border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-primary"></div>
                <p className="text-base font-semibold text-gray-700">TOUSKIE Assistant recherche...</p>
                <p className="text-xs text-gray-500 text-center">Génération des meilleures suggestions de fournisseurs pour vous.</p>
            </div>
        </div>
    );
}
