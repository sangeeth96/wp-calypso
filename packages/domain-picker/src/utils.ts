// eslint-disable-next-line wpcalypso/import-docblock
import type { DomainSuggestions } from '@automattic/data-stores';

export type DomainProduct = {
	meta: string;
	product_id: number;
	product_cost_display?: string;
	product_cost_display_with_zeros?: string;
	extra: {
		privacy_available: boolean;
		privacy: boolean;
		source: string;
		registrar?: string;
		is_hsts_required?: boolean;
	};
	product_slug?: string;
};

export function mockDomainSuggestion(
	domainName: string | undefined
): DomainSuggestions.DomainSuggestion | undefined {
	if ( ! domainName ) {
		return undefined;
	}

	return {
		domain_name: domainName,
		relevance: 1,
		supports_privacy: true,
		vendor: '',
		cost: '',
		product_id: 0,
		product_slug: '',
	};
}

export function mockDomainSuggestionFromCart(
	cartProduct: DomainProduct | undefined
): DomainSuggestions.DomainSuggestion | undefined {
	if ( ! cartProduct ) {
		return undefined;
	}

	return {
		domain_name: cartProduct.meta,
		relevance: 1,
		supports_privacy: cartProduct.extra.privacy_available,
		vendor: cartProduct.extra.registrar || '',
		cost: cartProduct.product_cost_display_with_zeros || '',
		product_id: cartProduct.product_id,
		product_slug: cartProduct.product_slug || '',
		hsts_required: cartProduct.extra.is_hsts_required,
	};
}
