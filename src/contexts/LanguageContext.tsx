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
  // const [googleTranslateLoaded, setGoogleTranslateLoaded] = useState(false);
  // const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // // Detect mobile browser
  // useEffect(() => {
  //   const checkMobile = () => {
  //     const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  //     const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  //     setIsMobile(mobileRegex.test(userAgent));
  //   };
  //   
  //   checkMobile();
  //   window.addEventListener('resize', checkMobile);
  //   return () => window.removeEventListener('resize', checkMobile);
  // }, []);

  // // NUCLEAR OPTION: Override removeChild globally to prevent Google Translate errors
  // useEffect(() => {
  //   // Store original removeChild
  //   const originalRemoveChild = Node.prototype.removeChild;
  //   
  //   // Override removeChild to catch and suppress Google Translate errors
  //   Node.prototype.removeChild = function<T extends Node>(child: T): T {
  //     try {
  //       // Check if this is a Google Translate related element
  //       const isGoogleTranslateElement = 
  //         child && 
  //         (('className' in child && typeof child.className === 'string' && child.className.includes('goog-te')) || 
  //          ('id' in child && typeof child.id === 'string' && child.id.includes('goog-te')) ||
  //          ('className' in child && typeof child.className === 'string' && child.className.includes('VIpgJd')) ||
  //          ('tagName' in child && child.tagName === 'IFRAME' && 'src' in child && typeof child.src === 'string' && child.src.includes('translate.google.com')));
  //       
  //       if (isGoogleTranslateElement) {
  //         console.warn('Suppressed Google Translate removeChild operation:', child);
  //         // Instead of removing, just hide it
  //         if (child instanceof HTMLElement) {
  //           child.style.setProperty('display', 'none', 'important');
  //           child.style.setProperty('visibility', 'hidden', 'important');
  //           child.style.setProperty('height', '0', 'important');
  //           child.style.setProperty('width', '0', 'important');
  //           child.style.setProperty('position', 'absolute', 'important');
  //           child.style.setProperty('top', '-9999px', 'important');
  //           child.style.setProperty('left', '-9999px', 'important');
  //           child.style.setProperty('z-index', '-9999', 'important');
  //         }
  //         return child; // Return the child to satisfy the function signature
  //       }
  //       
  //       // For non-Google Translate elements, use original removeChild
  //       return originalRemoveChild.call(this, child) as T;
  //     } catch (error) {
  //       console.warn('Error in overridden removeChild:', error);
  //       // If there's any error, just return the child without removing
  //       return child;
  //     }
  //   };

  //   // Restore original removeChild on cleanup
  //   return () => {
  //     Node.prototype.removeChild = originalRemoveChild;
  //   };
  // }, []);

  // // Load language preference from localStorage on mount
  // useEffect(() => {
  //   try {
  //     const savedLanguage = localStorage.getItem('language') as Language;
  //     if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'it')) {
  //       setLanguageState(savedLanguage);
  //       
  //       // If Italian is loaded from localStorage, trigger translation after a delay
  //       if (savedLanguage === 'it') {
  //         setTimeout(() => {
  //           setLanguage('it');
  //         }, 1000);
  //       }
  //     }
  //   } catch (error) {
  //     console.warn('Error loading language preference:', error);
  //   }
  // }, []);

  // // Static CSS injection to hide Google Translate banner
  // useEffect(() => {
  //   try {
  //     // Only inject CSS if it doesn't already exist
  //     if (!document.getElementById('google-translate-hide')) {
  //       const style = document.createElement('style');
  //       style.id = 'google-translate-hide';
  //       style.textContent = `
  //         /* Hide Google Translate Banner - CSS ONLY */
  //         .goog-te-banner-frame,
  //         .goog-te-banner-frame.skiptranslate,
  //         .goog-te-gadget,
  //         .goog-te-gadget .goog-te-combo,
  //         .goog-te-menu-value,
  //         .VIpgJd-ZVi9od-ORHb,
  //         .VIpgJd-ZVi9od-ORHb-KE6vqe,
  //         .goog-te-spinner-pos,
  //         .goog-te-spinner-animation,
  //         .goog-te-spinner,
  //         .goog-te-spinner-img,
  //         iframe[src*="translate.google.com"],
  //         iframe[src*="translate.googleapis.com"],
  //         div[class*="goog-te"],
  //         div[class*="VIpgJd"],
  //         div[id*="goog-te"],
  //         table[class*="goog-te"],
  //         table[class*="VIpgJd"],
  //         [class*="goog-te"],
  //         [id*="goog-te"],
  //         [class*="VIpgJd"] {
  //           display: none !important;
  //           visibility: hidden !important;
  //           height: 0 !important;
  //           width: 0 !important;
  //           overflow: hidden !important;
  //           position: absolute !important;
  //           top: -9999px !important;
  //           left: -9999px !important;
  //           z-index: -9999 !important;
  //           opacity: 0 !important;
  //           pointer-events: none !important;
  //           clip: rect(0, 0, 0, 0) !important;
  //           margin: 0 !important;
  //           padding: 0 !important;
  //           border: none !important;
  //         }

  //         /* Prevent body shift */
  //         body {
  //           top: 0px !important;
  //           position: static !important;
  //         }
  //       `;
  //       
  //       document.head.appendChild(style);
  //     }
  //   } catch (error) {
  //     console.warn('Error setting up Google Translate CSS:', error);
  //   }
  // }, []);

  // // Load Google Translate script only once and keep it loaded
  // useEffect(() => {
  //   if (!googleTranslateLoaded && !window.google?.translate?.TranslateElement) {
  //     try {
  //       const script = document.createElement('script');
  //       script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  //       script.async = true;
  //       script.onload = () => {
  //         setGoogleTranslateLoaded(true);
  //       };
  //       document.head.appendChild(script);
  //       } catch (error) {
  //         console.warn('Error loading Google Translate script:', error);
  //       }
  //     }
  //   }, [googleTranslateLoaded]);

  // // Initialize Google Translate when script is loaded
  // useEffect(() => {
  //   if (googleTranslateLoaded && language === 'it') {
  //     try {
  //       // Initialize Google Translate
  //       window.googleTranslateElementInit = () => {
  //         try {
  //           new window.google.translate.TranslateElement({
  //             pageLanguage: 'en',
  //             includedLanguages: 'it',
  //             autoDisplay: false,
  //             layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
  //           }, 'google_translate_element');
  //           
  //           // Trigger translation to Italian after a short delay
  //           setTimeout(() => {
  //             try {
  //               const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  //               if (select) {
  //                 select.value = 'it';
  //                 select.dispatchEvent(new Event('change'));
  //               }
  //             } catch (error) {
  //               console.warn('Error triggering translation:', error);
  //             }
  //           }, 1500);
  //         } catch (error) {
  //           console.warn('Google Translate initialization error:', error);
  //         }
  //       };

  //       // Call the init function if it hasn't been called yet
  //       if (window.google?.translate?.TranslateElement) {
  //         window.googleTranslateElementInit();
  //       }
  //     } catch (error) {
  //       console.warn('Error setting up Google Translate:', error);
  //     }
  //   }
  // }, [googleTranslateLoaded, language]);

  const setLanguage = (lang: Language) => {
    // COMMENTED OUT ALL TRANSLATION LOGIC
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    
    // // try {
    // //   setLanguageState(lang);
    // //   localStorage.setItem('language', lang);
    // //   
    // //   // Update HTML lang attribute
    // //   if (typeof document !== 'undefined') {
    // //     document.documentElement.lang = lang;
    // //     
    // //     if (lang === 'it') {
    // //       // MOBILE-SPECIFIC HANDLING
    // //       if (isMobile) {
    // //         // For mobile, use a different approach - redirect to Google Translate
    // //         const currentUrl = window.location.href;
    // //         const googleTranslateUrl = `https://translate.google.com/translate?sl=en&tl=it&u=${encodeURIComponent(currentUrl)}`;
    // //         window.location.href = googleTranslateUrl;
    // //         return;
    // //       }
    // //       
    // //       // For desktop, use normal Google Translate Element
    // //       if (googleTranslateLoaded && window.google?.translate?.TranslateElement) {
    // //         try {
    // //           // Clear and reinitialize the translate element
    // //           const translateElement = document.getElementById('google_translate_element');
    // //           if (translateElement) {
    // //             translateElement.innerHTML = '';
    // //           }
    // //           
    // //           // Reinitialize Google Translate
    // //           new window.google.translate.TranslateElement({
    // //             pageLanguage: 'en',
    // //             includedLanguages: 'it',
    // //             autoDisplay: false,
    // //             layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    // //           }, 'google_translate_element');
    // //           
    // //           // Trigger translation with multiple attempts for mobile compatibility
    // //           const triggerTranslation = () => {
    // //             try {
    // //               const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    // //               if (select) {
    // //                 select.value = 'it';
    // //                 select.dispatchEvent(new Event('change'));
    // //                 return true;
    // //               }
    // //               
    // //               // Alternative: try clicking the translate button
    // //               const translateButton = document.querySelector('.goog-te-banner-frame button') as HTMLButtonElement;
    // //               if (translateButton) {
    // //                 translateButton.click();
    // //                 return true;
    // //               }
    // //               
    // //               return false;
    // //             } catch (error) {
    // //               return false;
    // //             }
    // //           };
    // //           
    // //           // Try multiple times with delays for mobile
    // //           setTimeout(() => triggerTranslation(), 1000);
    // //           setTimeout(() => triggerTranslation(), 2000);
    // //           setTimeout(() => triggerTranslation(), 3000);
    // //           
    // //         } catch (error) {
    // //           // If all else fails, reload page to force translation
    // //           window.location.reload();
    // //         }
    // //       } else {
    // //         // Try to load Google Translate if not loaded
    // //         if (!window.google?.translate?.TranslateElement) {
    // //           try {
    // //             const script = document.createElement('script');
    // //             script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    // //             script.async = true;
    // //             script.onload = () => {
    // //               setGoogleTranslateLoaded(true);
    // //               // Retry setting language after script loads
    // //               setTimeout(() => setLanguage(lang), 1000);
    // //             };
    // //             document.head.appendChild(script);
    // //           } catch (error) {
    // //             // If script loading fails, reload page
    // //             window.location.reload();
    // //           }
    // //         }
    // //       }
    // //     } else {
    // //       // Reset to English
    // //       try {
    // //         // Clear the translate element
    // //         const translateElement = document.getElementById('google_translate_element');
    // //         if (translateElement) {
    // //           translateElement.innerHTML = '';
    // //         }

    // //         // Reset body styles
    // //         if (document.body) {
    // //           document.body.style.top = '';
    // //           document.body.style.position = '';
    // //         }

    // //         // Reset HTML lang attribute
    // //         document.documentElement.lang = 'en';
    // //         
    // //         // Force Google Translate to restore original text
    // //         if (googleTranslateLoaded && window.google?.translate?.TranslateElement) {
    // //           try {
    // //             // Reinitialize Google Translate with English
    // //             new window.google.translate.TranslateElement({
    // //               pageLanguage: 'en',
    // //               includedLanguages: 'en',
    // //               autoDisplay: false,
    // //               layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    // //             }, 'google_translate_element');
    // //             
    // //             // Trigger translation back to English
    // //             setTimeout(() => {
    // //               try {
    // //                 const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    // //                 if (select) {
    // //                     select.value = 'en';
    // //                     select.dispatchEvent(new Event('change'));
    // //                   }
    // //                 } catch (error) {
    // //                   // If English reset fails, reload page
    // //                   window.location.reload();
    // //                 }
    // //               }, 500);
    // //             } catch (error) {
    // //               // Fallback: reload page to completely reset
    // //               window.location.reload();
    // //             }
    // //           }
    // //           
    // //         } catch (error) {
    // //           // Fallback: reload page to completely reset
    // //           window.location.reload();
    // //         }
    // //       }
    // //     } catch (error) {
    // //       // If anything fails, reload the page
    // //       window.location.reload();
    // //     }
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
      {/* <div id="google_translate_element" style={{ display: 'none', visibility: 'hidden', height: 0, overflow: 'hidden' }}></div> */}
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
// declare global {
//   interface Window {
//     google: {
//       translate: {
//         TranslateElement: any;
//       };
//     };
//     googleTranslateElementInit: () => void;
//   }
// } 