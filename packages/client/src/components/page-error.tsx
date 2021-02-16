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

export default function PageError({
    errorMsg,
}: {
    errorMsg: string;
}): JSX.Element {
    return (
        <Container className='error-container'>
            <BrokenWineGlass />
            <h3>Oops, something broke.</h3>
            <p className='error-message'>Error: {errorMsg}</p>

            <h6>Refresh the page to try again.</h6>
        </Container>
    );
}
