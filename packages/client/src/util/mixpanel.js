import mixpanel from 'mixpanel-browser';

class MixpanelWrapper {
    isActive = false;

    constructor() {
        const token = process.env.REACT_APP_MIXPANEL_TOKEN;
        if (token) {
            this.isActive = true;
            mixpanel.init(token, { debug: true });
            mixpanel.track('page_load');
        }
    }

    track(...args) {
        // No-op if not using
        if (!this.isActive) return;
        mixpanel.track(...args);
    }
}

export default MixpanelWrapper;
