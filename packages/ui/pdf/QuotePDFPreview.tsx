'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';
import type { Quote, EventoSummary, EmpresaConfig } from '../cotizaciones/quote.types';

interface QuotePDFPreviewProps {
  quote: Quote;
  evento: EventoSummary;
  empresa: EmpresaConfig;
}

export function QuotePDFPreview({ quote, evento, empresa }: QuotePDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/pdf/quote/${quote.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote, evento, empresa }),
      });

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 text-aurea-gold animate-spin" />
        <p className="text-sm text-neutral-500">Generando PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={generatePDF} className="text-sm text-aurea-gold hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
        <h3 className="text-lg font-semibold">Vista previa del PDF</h3>
        <p className="text-sm text-neutral-500 text-center max-w-xs">
          Genera la cotización para ver la preview
        </p>
        <button
          onClick={generatePDF}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-aurea-gold bg-aurea-gold/10 hover:bg-aurea-gold/20 rounded-xl transition-colors"
        >
          <FileText className="w-4 h-4" />
          Generar PDF
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <a
          href={pdfUrl}
          download={`cotizacion-${quote.id}.pdf`}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar
        </a>
      </div>
      <iframe
        src={pdfUrl}
        className="flex-1 w-full border-0"
        title="PDF Preview"
      />
    </div>
  );
}
