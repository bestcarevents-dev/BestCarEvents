import React, {ReactElement, ReactNode} from 'react';
import {cache, cacheKeyFrom, computeStableHash} from '@/lib/translate/cache';
import {translateBatch} from '@/lib/translate/translator';

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
    // Respect opt-out markers
    const className: any = (element.props && element.props.className) || '';
    const hasNoTranslateAttr = !!(element.props && (element.props['data-no-translate'] || element.props.translate === 'no'));
    const hasNoTranslateClass = typeof className === 'string' && className.split(' ').includes('notranslate');
    if (hasNoTranslateAttr || hasNoTranslateClass) return;
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
    // Respect opt-out markers
    const className: any = (element.props && element.props.className) || '';
    const hasNoTranslateAttr = !!(element.props && (element.props['data-no-translate'] || element.props.translate === 'no'));
    const hasNoTranslateClass = typeof className === 'string' && className.split(' ').includes('notranslate');
    if (hasNoTranslateAttr || hasNoTranslateClass) return node;
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
  const keys = texts.map((t) => cacheKeyFrom(computeStableHash(t), locale));
  const existing = await Promise.all(keys.map((k) => cache.get(k)));

  const missingTexts: string[] = [];
  const missingIdx: number[] = [];
  existing.forEach((val, i) => {
    if (!val) {
      missingTexts.push(texts[i]);
      missingIdx.push(i);
    }
  });

  if (missingTexts.length > 0) {
    // Synchronously translate missing texts so first view is localized
    await translateBatch({texts: missingTexts, sourceLocale: defaultLocale, targetLocale: locale});
  }

  // Read again (all should be present now)
  const finalVals = await Promise.all(keys.map((k) => cache.get(k)));
  const map = new Map<string, string>();
  for (let i = 0; i < texts.length; i++) {
    map.set(texts[i], finalVals[i] || texts[i]);
  }

  const out = replaceTexts(children, (s) => map.get(s) ?? s);
  return <>{out}</>;
}


