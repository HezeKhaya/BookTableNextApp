
export const CATEGORY_MAPPINGS: Record<string, string> = {
    CL: 'Christian Living',
    DOCT: 'Doctrine',
    FAM: 'Family',
    CH: 'Uncategorised',
    REF: 'Reference',
    PURITAN: 'Puritan'
};

export function getTopLevelCategory(categoryString: string): string {
    if (!categoryString) return 'CH';
    return categoryString.split(' ')[0];
}

export function getCategoryDisplayName(code: string): string {
    return CATEGORY_MAPPINGS[code] || code;
}
