import React, {ReactElement, ReactNode} from 'react';
import {getTranslationsOrDefault} from '@/lib/translate/runtime';

type Props = {
  locale: string;
  defaultLocale: string;
  children: ReactNode;
};

function isTextNode(node: ReactNode): node is string {
  return typeof node === 'string' && node.trim().length > 0;
}

function collectTexts(node: ReactNode, bucket: Set<string>) {
  if (node == null) return;
  if (isTextNode(node)) {
    bucket.add(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) collectTexts(child, bucket);
    return;
  }
  if (React.isValidElement(node)) {
    const element = node as ReactElement<any>;
    // Skip script/style-like tags by type string
    const t: any = element.type as any;
    const tagName = typeof t === 'string' ? t : undefined;
    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') return;
    collectTexts(element.props?.children, bucket);
    return;
  }
}

function replaceTexts(node: ReactNode, translate: (s: string) => string): ReactNode {
  if (node == null) return node;
  if (isTextNode(node)) {
    return translate(node);
  }
  if (Array.isArray(node)) {
    return node.map((child, idx) => replaceTexts(child, translate));
  }
  if (React.isValidElement(node)) {
    const element = node as ReactElement<any>;
    const t: any = element.type as any;
    const tagName = typeof t === 'string' ? t : undefined;
    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') return node;
    const newChildren = replaceTexts(element.props?.children, translate);
    return React.cloneElement(element, element.props, newChildren);
  }
  return node;
}

export default async function AutoTranslate({locale, defaultLocale, children}: Props) {
  if (locale === defaultLocale) return <>{children}</>;

  const uniqueTexts = new Set<string>();
  collectTexts(children, uniqueTexts);

  if (uniqueTexts.size === 0) return <>{children}</>;

  const texts = Array.from(uniqueTexts);
  const translated = await getTranslationsOrDefault(texts, locale, defaultLocale);
  const map = new Map<string, string>();
  for (let i = 0; i < texts.length; i++) map.set(texts[i], translated[i]);

  const out = replaceTexts(children, (s) => map.get(s) ?? s);
  return <>{out}</>;
}


