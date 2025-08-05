"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type Language = 'en' | 'it';

export interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<TranslationContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Load language preference from localStorage on mount
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'it')) {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.warn('Error loading language preference:', error);
    }
  }, []);

  // Static CSS injection to hide Google Translate banner
  useEffect(() => {
    try {
      // Only inject CSS if it doesn't already exist
      if (!document.getElementById('google-translate-hide')) {
        const style = document.createElement('style');
        style.id = 'google-translate-hide';
        style.textContent = `
          /* Hide Google Translate Banner - CSS ONLY */
          .goog-te-banner-frame,
          .goog-te-banner-frame.skiptranslate,
          .goog-te-gadget,
          .goog-te-gadget .goog-te-combo,
          .goog-te-menu-value,
          .VIpgJd-ZVi9od-ORHb,
          .VIpgJd-ZVi9od-ORHb-KE6vqe,
          .goog-te-spinner-pos,
          .goog-te-spinner-animation,
          .goog-te-spinner,
          .goog-te-spinner-img,
          iframe[src*="translate.google.com"],
          iframe[src*="translate.googleapis.com"],
          div[class*="goog-te"],
          div[class*="VIpgJd"],
          div[id*="goog-te"],
          table[class*="goog-te"],
          table[class*="VIpgJd"],
          [class*="goog-te"],
          [id*="goog-te"],
          [class*="VIpgJd"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            z-index: -9999 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            clip: rect(0, 0, 0, 0) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }

          /* Prevent body shift */
          body {
            top: 0px !important;
            position: static !important;
          }
        `;
        
        document.head.appendChild(style);
      }
    } catch (error) {
      console.warn('Error setting up Google Translate CSS:', error);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    try {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
      
      // Update HTML lang attribute
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        
        // TEMPORARILY DISABLED: Google Translate to test if error still occurs
        if (lang === 'it') {
          console.log('Italian selected - Google Translate temporarily disabled for testing');
          // Google Translate code commented out for testing
          /*
          if (!window.google?.translate?.TranslateElement) {
            const script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.head.appendChild(script);
          }
          
          window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'it',
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            }, 'google_translate_element');
            
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (select) {
                select.value = 'it';
                select.dispatchEvent(new Event('change'));
              }
            }, 1500);
          };
          */
        } else {
          // Reset to English
          try {
            // Clear the translate element
            const translateElement = document.getElementById('google_translate_element');
            if (translateElement) {
              translateElement.innerHTML = '';
            }

            // Reset body styles
            if (document.body) {
              document.body.style.top = '';
              document.body.style.position = '';
            }

            // Reset HTML lang attribute
            document.documentElement.lang = 'en';
            
          } catch (error) {
            console.warn('Error resetting Google Translate:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Error in setLanguage:', error);
    }
  };

  const value: TranslationContextType = {
    language,
    setLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }}></div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Add Google Translate types to window
declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: any;
      };
    };
    googleTranslateElementInit: () => void;
  }
} 