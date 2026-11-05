import LegalPage from "../components/LegalPage";

const Impressum = () => (
    <LegalPage title="Impressum">
        <p className="legal-note">
            Hinweis: CheckIn ist ein fiktives Demoprojekt. Alle Angaben auf dieser Seite sind
            erfundene Platzhalter und keine echten Personen, Firmen oder Adressen.
        </p>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
            Muster Software GmbH<br />
            Beispielstraße 1<br />
            12345 Musterstadt<br />
            Deutschland
        </p>

        <h2>Vertreten durch</h2>
        <p>Geschäftsführung: Max Mustermann</p>

        <h2>Kontakt</h2>
        <p>
            Telefon: +49 (0)123 4567890<br />
            E-Mail: kontakt@checkin.example
        </p>

        <h2>Registereintrag</h2>
        <p>
            Registergericht: Amtsgericht Musterstadt<br />
            Registernummer: HRB 000000
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE000000000</p>

        <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
        <p>Max Mustermann, Anschrift wie oben</p>
    </LegalPage>
);

export default Impressum;
