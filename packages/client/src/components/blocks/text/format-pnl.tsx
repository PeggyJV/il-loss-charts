export const FormatPNL = ({
    children,
    isNegative,
}: {
    children: string | JSX.Element;
    isNegative: boolean;
}): JSX.Element => {
    return (
        <div
            style={{
                color: isNegative
                    ? 'var(--faceNegative)'
                    : 'var(--facePositive)',
                lineHeight: '2rem',
            }}
        >
            {children}
        </div>
    );
};
