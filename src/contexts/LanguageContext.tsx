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

  // Add CSS to hide Google Translate banner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .goog-te-banner-frame {
        display: none !important;
      }
      .goog-te-menu-value {
        display: none !important;
      }
      .goog-te-gadget {
        display: none !important;
      }
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      body {
        top: 0px !important;
      }
      .VIpgJd-ZVi9od-ORHb {
        display: none !important;
      }
      .VIpgJd-ZVi9od-ORHb-KE6vqe {
        display: none !important;
      }
      .goog-te-spinner-pos {
        display: none !important;
      }
      .goog-te-spinner-animation {
        display: none !important;
      }
      .goog-te-spinner {
        display: none !important;
      }
      .goog-te-spinner-img {
        display: none !important;
      }
      .goog-te-banner-frame {
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .goog-te-banner-frame.skiptranslate {
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .goog-te-gadget {
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .goog-te-gadget .goog-te-combo {
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .goog-te-banner-frame {
        position: absolute !important;
        top: -1000px !important;
        left: -1000px !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
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
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            }, 'google_translate_element');
            
            // Trigger translation to Italian after a short delay
            setTimeout(() => {
              const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
              if (select) {
                select.value = 'it';
                select.dispatchEvent(new Event('change'));
              }
              
              // Hide any remaining Google Translate elements
              const elements = document.querySelectorAll('.goog-te-banner-frame, .goog-te-gadget, .VIpgJd-ZVi9od-ORHb');
              elements.forEach(el => {
                if (el instanceof HTMLElement) {
                  el.style.display = 'none';
                  el.style.visibility = 'hidden';
                  el.style.height = '0';
                  el.style.overflow = 'hidden';
                }
              });
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