'use client';

import { useState, useEffect } from 'react';
import { Building2, LogOut, HelpCircle, Loader2, ChevronRight } from 'lucide-react';

interface Company {
  empresa_id: string;
  empresa_nombre: string;
  empresa_nombre_corto: string;
  empresa_logo: string;
  rol: string;
}

interface CompanySelectorProps {
  companies: Company[];
  onSelect: (company: Company) => void;
  onSignOut: () => void;
  userName?: string;
}

export function CompanySelector({
  companies,
  onSelect,
  onSignOut,
  userName,
}: CompanySelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (company: Company) => {
    setIsLoading(true);
    try {
      await onSelect(company);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-aurea-gold/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-aurea-gold" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Selecciona tu empresa
          </h1>
          {userName && (
            <p className="text-sm text-neutral-500">
              Hola, <span className="font-medium">{userName}</span>
            </p>
          )}
          <p className="text-sm text-neutral-500 mt-1">
            Tienes acceso a {companies.length} empresa{companies.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <button
              key={company.empresa_id}
              onClick={() => handleSelect(company)}
              disabled={isLoading}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-aurea-gold hover:shadow-lg transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                {company.empresa_logo ? (
                  <img
                    src={company.empresa_logo}
                    alt={company.empresa_nombre}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              
              <div className="flex-1 text-left">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {company.empresa_nombre_corto || company.empresa_nombre}
                </p>
                <p className="text-sm text-neutral-500">
                  {company.empresa_nombre_corto ? company.empresa_nombre : ''}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-aurea-gold/10 text-aurea-gold rounded">
                  {company.rol}
                </span>
              </div>
              
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-aurea-gold transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
            
            <button
              onClick={() => window.open('mailto:soporte@aurea.app', '_blank')}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Contactar soporte
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm rounded-2xl">
            <Loader2 className="w-8 h-8 text-aurea-gold animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

interface NoCompanyErrorProps {
  onSignOut: () => void;
  onContactSupport: () => void;
}

export function NoCompanyError({ onSignOut, onContactSupport }: NoCompanyErrorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
          Sin acceso a empresas
        </h1>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Tu cuenta no está asociada a ninguna empresa activa. 
          Esto puede ocurrir si tu acceso fue revocado o si hay un error de configuración.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión e intentar de nuevo
          </button>
          
          <button
            onClick={onContactSupport}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-aurea-gold/10 text-aurea-gold font-semibold rounded-xl hover:bg-aurea-gold/20 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            Contactar soporte
          </button>
        </div>
      </div>
    </div>
  );
}
