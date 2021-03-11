import { Container } from 'react-bootstrap';

import SvgUrl from 'styles/broken-wine-glass.svg';

const svgHtml = `
    <svg width="90" height="90">       
        <image xlink:href="${SvgUrl}" width="90" height="90"/>    
    </svg>
`;

const BrokenWineGlass = () => (
    <div className='wine-spill' dangerouslySetInnerHTML={{ __html: svgHtml }} />
);

// some placeholder components we can flesh out in detail later
// encapsulating all markup and keeping it static makes the error boundary usage more readable instead of a render-prop

export const ComponentError = (): JSX.Element => {
    return (
        <div className='error-container'>
            <BrokenWineGlass />
            <h3>Failed to load component.</h3>
            <h6>Refresh page to try again.</h6>
        </div>
    );
};

export const ModalError = (): JSX.Element => {
    return (
        <div className='error-container'>
            <BrokenWineGlass />
            <h3>Failed to load modal.</h3>
            <h6>Refresh page to try again.</h6>
        </div>
    );
};

export const DataError = (): JSX.Element => {
    return (
        <div className='error-container'>
            <BrokenWineGlass />
            <h3>Failed to fetch data.</h3>
            <h6>Refresh page to try again.</h6>
        </div>
    );
};

export const PageError = ({
    errorMsg,
}: {
    errorMsg?: string | Error;
}): JSX.Element => {
    return (
        <Container className='error-container'>
            <BrokenWineGlass />
            <h3>Oops, something broke.</h3>
            <p className='error-message'>Error: {errorMsg}</p>
            <h6>Refresh the page to try again.</h6>
        </Container>
    );
};
