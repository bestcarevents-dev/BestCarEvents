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
        // Initialize Google Translate if not already done
        if (!window.google?.translate?.TranslateElement) {
          const script = document.createElement('script');
          script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          script.async = true;
          document.head.appendChild(script);
        }
        
        // Initialize Google Translate
        window.googleTranslateElementInit = () => {
          try {
            new window.google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'it',
              autoDisplay: false,
            }, 'google_translate_element');
            
            // Trigger translation to Italian after a short delay
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (select) {
                select.value = 'it';
                select.dispatchEvent(new Event('change'));
              }
            }, 1500);
          } catch (error) {
            console.error('Google Translate initialization error:', error);
          }
        };
      } else {
        // Reset to English - safely remove Google Translate
        try {
          // Clear the translate element
          const translateElement = document.getElementById('google_translate_element');
          if (translateElement) {
            translateElement.innerHTML = '';
          }
          
          // Remove Google Translate iframe if it exists
          const iframes = document.querySelectorAll('iframe[src*="translate.google.com"]');
          iframes.forEach(iframe => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          });
          
          // Remove Google Translate banner if it exists
          const banners = document.querySelectorAll('.goog-te-banner-frame');
          banners.forEach(banner => {
            if (banner.parentNode) {
              banner.parentNode.removeChild(banner);
            }
          });
          
          // Remove Google Translate styles
          const styles = document.querySelectorAll('style[data-google-translate]');
          styles.forEach(style => {
            if (style.parentNode) {
              style.parentNode.removeChild(style);
            }
          });
          
          // Reset page language
          document.documentElement.lang = 'en';
          
          // Reload page to completely reset translation
          window.location.reload();
        } catch (error) {
          console.error('Error removing Google Translate:', error);
          // Fallback: reload page to reset everything
          window.location.reload();
        }
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