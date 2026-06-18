import { escapeHTML } from '../../shared.js';

export const treatmentTypeLabelHtml = (treatment) => {
    const type = String(treatment?.type ?? '');
    const otherDescribe = type === 'other' ? String(treatment?.otherDescribe ?? '').trim() : '';
    return `<span data-i18n="shareHealthInfo.tx_${escapeHTML(type)}">${escapeHTML(type)}</span>${otherDescribe ? ` (${escapeHTML(otherDescribe)})` : ''}`;
};
