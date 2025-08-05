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

  // CSS injection to hide Google Translate banner - NO DOM MANIPULATION
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'google-translate-hide';
    style.textContent = `
      /* Hide Google Translate Banner - CSS ONLY APPROACH */
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

    // NO CLEANUP FUNCTION - let the style stay in the DOM
  }, []);

  // Function to hide Google Translate elements with CSS ONLY
  const hideGoogleTranslateElements = () => {
    const selectors = [
      '.goog-te-banner-frame',
      '.goog-te-banner-frame.skiptranslate',
      '.goog-te-gadget',
      '.goog-te-gadget .goog-te-combo',
      '.goog-te-menu-value',
      '.VIpgJd-ZVi9od-ORHb',
      '.VIpgJd-ZVi9od-ORHb-KE6vqe',
      '.goog-te-spinner-pos',
      '.goog-te-spinner-animation',
      '.goog-te-spinner',
      '.goog-te-spinner-img',
      'iframe[src*="translate.google.com"]',
      'iframe[src*="translate.googleapis.com"]',
      'div[class*="goog-te"]',
      'div[class*="VIpgJd"]',
      'div[id*="goog-te"]',
      'table[class*="goog-te"]',
      'table[class*="VIpgJd"]',
      '[class*="goog-te"]',
      '[id*="goog-te"]',
      '[class*="VIpgJd"]'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('height', '0', 'important');
          el.style.setProperty('width', '0', 'important');
          el.style.setProperty('position', 'absolute', 'important');
          el.style.setProperty('top', '-9999px', 'important');
          el.style.setProperty('left', '-9999px', 'important');
          el.style.setProperty('z-index', '-9999', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    });
  };

  // Set up a MutationObserver to continuously hide Google Translate elements
  useEffect(() => {
    const observer = new MutationObserver(() => {
      hideGoogleTranslateElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'src']
    });

    return () => observer.disconnect();
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
              
              // Hide any Google Translate elements
              hideGoogleTranslateElements();
              
              // Set up continuous hiding
              const hideInterval = setInterval(() => {
                hideGoogleTranslateElements();
              }, 100);
              
              // Stop the interval after 10 seconds
              setTimeout(() => {
                clearInterval(hideInterval);
              }, 10000);
            }, 1500);
          } catch (error) {
            console.error('Google Translate initialization error:', error);
          }
        };
      } else {
        // Reset to English - CSS ONLY APPROACH
        try {
          // Clear the translate element
          const translateElement = document.getElementById('google_translate_element');
          if (translateElement) {
            translateElement.innerHTML = '';
          }

          // Reset body styles that Google Translate might have added
          if (document.body) {
            document.body.style.top = '';
            document.body.style.position = '';
          }

          // Reset HTML lang attribute
          document.documentElement.lang = 'en';

          // Hide any remaining Google Translate elements
          hideGoogleTranslateElements();
          
        } catch (error) {
          console.error('Error resetting Google Translate:', error);
          // If all else fails, just hide everything
          hideGoogleTranslateElements();
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