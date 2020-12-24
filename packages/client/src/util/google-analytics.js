// utils/GoogleAnalytics.js
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ReactGA from 'react-ga';
import { Route } from 'react-router-dom';

export default function GoogleAnalytics() {
    function logPageChange(pathname, search = '') {
        const page = pathname + search;
        const { location } = window;
        ReactGA.set({
            page,
            location: `${location.origin}${page}`,
            ...this.props.options
        });
        ReactGA.pageview(page);
    }

    useEffect(() => {
        logPageChange(
            window.location.pathname,
            window.location.search
        );
    }, []);

    useEffect(() => {
        const { pathname, search } = window.location;
        const isDifferentPathname = pathname !== prevLocation.pathname;
        const isDifferentSearch = search !== prevLocation.search;

        if (isDifferentPathname || isDifferentSearch) {
            logPageChange(pathname, search);
        }
    }, [window.location]);

    const prevLocationRef = useRef();
    useEffect(() => {
        prevLocationRef.current = window.location;
    });
    const prevLocation = prevLocationRef.current;

    return null;
}

GoogleAnalytics.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string
    }).isRequired,
    options: PropTypes.object
};

export const init = (options = {}) => {
    const isGAEnabled = process.env.NODE_ENV === 'production';

    if (isGAEnabled) {
        console.log('Enabling google analytics');
        ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
    }

    return isGAEnabled;
};