import LegalPage from "../../components/LegalPage";

// Englische Übersetzung des Impressums. Maßgeblich ist die deutsche Fassung (Impressum.jsx).
const ImpressumEn = () => (
    <LegalPage title="Legal notice">
        <p className="legal-note">
            Note: CheckIn is a fictional demo project. All details on this page are made-up
            placeholders and do not refer to real people, companies or addresses. This is an
            English courtesy translation, the German version is authoritative.
        </p>

        <h2>Information pursuant to § 5 DDG</h2>
        <p>
            Muster Software GmbH<br />
            Beispielstraße 1<br />
            12345 Musterstadt<br />
            Germany
        </p>

        <h2>Represented by</h2>
        <p>Management: Max Mustermann</p>

        <h2>Contact</h2>
        <p>
            Phone: +49 (0)123 4567890<br />
            Email: kontakt@checkin.example
        </p>

        <h2>Commercial register</h2>
        <p>
            Register court: Amtsgericht Musterstadt<br />
            Registration number: HRB 000000
        </p>

        <h2>VAT ID</h2>
        <p>VAT identification number pursuant to § 27a UStG: DE000000000</p>

        <h2>Responsible for the content (§ 18 para. 2 MStV)</h2>
        <p>Max Mustermann, address as above</p>
    </LegalPage>
);

export default ImpressumEn;
