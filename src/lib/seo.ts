import type { Metadata } from 'next';

export function getSiteUrl(): string {
	const envUrl =
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		process.env.VERCEL_PROJECT_PRODUCTION_URL ||
		process.env.VERCEL_BRANCH_URL ||
		process.env.VERCEL_URL;
	if (!envUrl) return 'http://localhost:9002';
	if (envUrl.startsWith('http')) return envUrl;
	return `https://${envUrl}`;
}

export function toAbsoluteUrl(pathOrUrl: string, base?: string): string {
	if (!pathOrUrl) return pathOrUrl;
	if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
	const b = base || getSiteUrl();
	return `${b.replace(/\/$/, '')}/${pathOrUrl.replace(/^\//, '')}`;
}

export function pickImageUrl(data: any): string | undefined {
	if (!data) return undefined;
	const candidates: Array<string | undefined> = [];
	candidates.push(Array.isArray(data.images) ? data.images[0] : undefined);
	candidates.push(Array.isArray(data.imageUrls) ? data.imageUrls[0] : undefined);
	candidates.push(typeof data.imageUrl === 'string' ? data.imageUrl : undefined);
	return candidates.find(Boolean);
}

export function buildMetadata(options: {
	title: string;
	description: string;
	canonicalPath: string;
	imageUrl?: string;
    keywords?: string[];
    robots?: Metadata['robots'];
}): Metadata {
	const base = getSiteUrl();
	const canonical = toAbsoluteUrl(options.canonicalPath, base);
	return {
		title: options.title,
		description: options.description,
		alternates: { canonical },
		keywords: options.keywords,
		openGraph: {
			title: options.title,
			description: options.description,
			url: canonical,
			images: options.imageUrl ? [options.imageUrl] : undefined,
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: options.title,
			description: options.description,
			images: options.imageUrl ? [options.imageUrl] : undefined,
		},
		robots: options.robots || {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				'max-snippet': -1,
				'max-image-preview': 'large',
				'max-video-preview': -1,
			},
		},
	};
}


