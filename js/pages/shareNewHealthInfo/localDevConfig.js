export const getLocalApiBaseOverride = async () => {
    try {
        const cfg = await import('../../../local-dev/config.js');
        return typeof cfg.apiBaseOverride === 'string' && cfg.apiBaseOverride ? cfg.apiBaseOverride : '';
    } catch (e) {
        return '';
    }
};
