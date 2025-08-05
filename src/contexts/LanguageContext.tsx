"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'it')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      
      // Use browser translation for Italian
      if (lang === 'it') {
        // Create a Google Translate element if it doesn't exist
        if (!window.google?.translate?.TranslateElement) {
          const script = document.createElement('script');
          script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          script.async = true;
          document.head.appendChild(script);
        }
        
        // Initialize Google Translate
        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'it',
            autoDisplay: false,
          }, 'google_translate_element');
          
          // Trigger translation to Italian
          setTimeout(() => {
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
              select.value = 'it';
              select.dispatchEvent(new Event('change'));
            }
          }, 1000);
        };
      } else {
        // Reset to English - remove Google Translate
        const translateElement = document.getElementById('google_translate_element');
        if (translateElement) {
          translateElement.innerHTML = '';
        }
        
        // Remove Google Translate script
        const scripts = document.querySelectorAll('script[src*="translate.google.com"]');
        scripts.forEach(script => script.remove());
        
        // Remove Google Translate iframe
        const iframes = document.querySelectorAll('iframe[src*="translate.google.com"]');
        iframes.forEach(iframe => iframe.remove());
        
        // Remove Google Translate styles
        const styles = document.querySelectorAll('style[data-google-translate]');
        styles.forEach(style => style.remove());
      }
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
      <div id="google_translate_element" style={{ display: 'none' }}></div>
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