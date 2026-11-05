const Karte = ({ titel, hinweis, children, className = "" }) => (
    <section className={`chart-box ${className}`}>
        <h3>{titel}{hinweis && <span className="chart-box__hint">{hinweis}</span>}</h3>
        {children}
    </section>
);

export default Karte;
