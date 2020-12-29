// utils/GoogleAnalytics.js
import { useEffect, useRef, useCallback } from 'react';
import ReactGA from 'react-ga';

export default function GoogleAnalytics({ options }) {
    const logPageChange = useCallback((pathname, search = '') => {
        const page = pathname + search;
        const { location } = window;
        ReactGA.set({
            page,
            location: `${location.origin}${page}`,
            options
        });
        ReactGA.pageview(page);
    }, [options]);

    const prevLocationRef = useRef();
    useEffect(() => {
        prevLocationRef.current = window.location;
    });
    const prevLocation = prevLocationRef.current;

    useEffect(() => {
        logPageChange(
            window.location.pathname,
            window.location.search
        );
    });

    useEffect(() => {
        const { pathname, search } = window.location;
        const isDifferentPathname = pathname !== prevLocation?.pathname;
        const isDifferentSearch = search !== prevLocation?.search;

        if (isDifferentPathname || isDifferentSearch) {
            logPageChange(pathname, search);
        }
    }, [prevLocation, logPageChange]);

    return null;
}

export const init = (options = {}) => {
    const isGAEnabled = process.env.NODE_ENV === 'production';

    if (isGAEnabled) {
        ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
    }

    return isGAEnabled;
};