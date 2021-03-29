import mixpanel from 'mixpanel-browser';

type TrackingArgs = [string, any];

class MixpanelWrapper {
    isActive = false;

    constructor() {
        const token = process.env.REACT_APP_MIXPANEL_TOKEN;
        if (token) {
            this.isActive = true;
            mixpanel.init(token, { debug: true });


            mixpanel.track('page_load');

            try {
              mixpanel.track('page_load', { distinct_id: Date.now() });
            } catch (e) {
                console.error(`Metrics error on page_load.`);
            }
        } else {
            console.warn('No analytics token received.');
        }
    }

    track(...args: TrackingArgs) {
        // No-op if not using
        if (!this.isActive) return;
        mixpanel.track(...args);
    }
}

export default new MixpanelWrapper();
