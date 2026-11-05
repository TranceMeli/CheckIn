import LegalPage from "../components/LegalPage";

const Datenschutz = () => (
    <LegalPage title="Datenschutzerklärung">
        <p className="legal-note">
            Hinweis: CheckIn ist ein fiktives Demoprojekt. Verantwortlicher, Kontaktdaten und
            Fristen sind Platzhalter und müssen bei einem echten Einsatz durch die tatsächlichen
            Angaben ersetzt und rechtlich geprüft werden. Alle Mitarbeiterdaten in dieser
            Anwendung sind frei erfundene Testdaten.
        </p>

        <h2>1. Verantwortlicher</h2>
        <p>
            Muster Software GmbH, Beispielstraße 1, 12345 Musterstadt<br />
            E-Mail: datenschutz@checkin.example<br />
            Datenschutzbeauftragte/r: dsb@checkin.example
        </p>

        <h2>2. Zweck der Anwendung</h2>
        <p>
            CheckIn dient der Erfassung des täglichen Arbeitsortes (Office, Home Office oder
            abwesend) von Beschäftigten sowie der Auswertung dieser Angaben für die
            Arbeitsorganisation (z. B. Raum- und Teamplanung).
        </p>

        <h2>3. Verarbeitete Daten</h2>
        <div className="legal-table-wrap">
            <table className="legal-table">
                <thead>
                    <tr><th>Datenkategorie</th><th>Zweck</th><th>Speicherdauer</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Stammdaten: Vor- und Nachname, E-Mail-Adresse, Abteilung, Rolle</td>
                        <td>Anlegen und Verwalten des Benutzerkontos, Zuordnung der Auswertungen</td>
                        <td>Bis zum Ende des Beschäftigungsverhältnisses, danach Löschung des Kontos</td>
                    </tr>
                    <tr>
                        <td>Zugangsdaten: Passwort (nur als Hash gespeichert)</td>
                        <td>Authentifizierung</td>
                        <td>Wie Stammdaten</td>
                    </tr>
                    <tr>
                        <td>Check-in-Daten: Datum, Uhrzeit, Status (Office / Home Office / Abwesend)</td>
                        <td>Anwesenheitsübersicht, Auswertungen, Export</td>
                        <td>24 Monate, danach Löschung oder Anonymisierung</td>
                    </tr>
                    <tr>
                        <td>Sitzungsdaten: Refresh-Token (Cookie und Datenbank)</td>
                        <td>Angemeldet bleiben, sichere Sitzungsverwaltung</td>
                        <td>Maximal 7 Tage bzw. bis zur Abmeldung</td>
                    </tr>
                    <tr>
                        <td>Technische Zugriffsdaten (IP-Adresse, Zeitpunkt, aufgerufene Adresse)</td>
                        <td>Betrieb, Fehleranalyse und Sicherheit des Servers</td>
                        <td>Maximal 14 Tage</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2>4. Rechtsgrundlagen</h2>
        <p>
            Die Verarbeitung der Stamm-, Zugangs- und Check-in-Daten erfolgt zur Durchführung des
            Beschäftigungsverhältnisses (Art. 6 Abs. 1 lit. b DSGVO in Verbindung mit § 26 BDSG).
            Technische Zugriffsdaten verarbeiten wir auf Grundlage unseres berechtigten Interesses
            an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h2>5. Wer hat Zugriff auf Ihre Daten?</h2>
        <ul className="legal-list">
            <li>Beschäftigte sehen ausschließlich ihre eigenen Check-in-Daten.</li>
            <li>
                Administratorinnen und Administratoren sehen Check-ins, Auswertungen und Exporte
                aller Beschäftigten und können Check-ins nachträglich erfassen.
            </li>
            <li>
                Dienstleister im Auftrag (Auftragsverarbeitung nach Art. 28 DSGVO): Hosting und
                E-Mail-Versand für Einladungen. Eine Übermittlung in Drittländer findet nicht statt.
            </li>
        </ul>

        <h2>6. Cookies und lokale Speicherung</h2>
        <p>
            Wir setzen ausschließlich ein technisch notwendiges Cookie ein („refreshToken“). Es
            ist als HttpOnly und Secure gekennzeichnet, dient allein der Sitzungsverwaltung und
            läuft nach 7 Tagen ab. Dafür ist nach § 25 Abs. 2 Nr. 2 TDDDG keine Einwilligung
            erforderlich, deshalb gibt es kein Cookie-Banner. Es gibt kein Tracking, keine
            Analyse- oder Werbedienste und keine von Drittanbietern eingebundenen Schriften oder
            Skripte. Das kurzlebige Zugriffstoken wird nur im Arbeitsspeicher des Browsers
            gehalten und nicht dauerhaft gespeichert.
        </p>

        <h2>7. Einladungs-E-Mails</h2>
        <p>
            Neue Beschäftigte erhalten von Administratoren eine E-Mail mit einem einmal nutzbaren
            Link, über den sie ihr Passwort selbst festlegen.
        </p>

        <h2>8. Ihre Rechte</h2>
        <p>Sie haben nach der DSGVO folgende Rechte gegenüber dem Verantwortlichen:</p>
        <ul className="legal-list">
            <li>Auskunft über Ihre gespeicherten Daten (Art. 15)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16)</li>
            <li>Löschung (Art. 17)</li>
            <li>Einschränkung der Verarbeitung (Art. 18)</li>
            <li>Datenübertragbarkeit (Art. 20)</li>
            <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21)</li>
        </ul>
        <p>
            Zur Ausübung Ihrer Rechte genügt eine E-Mail an datenschutz@checkin.example.
            Außerdem haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu
            beschweren (Art. 77 DSGVO), z. B. bei der Landesbeauftragten für den Datenschutz
            Ihres Bundeslandes.
        </p>

        <h2>9. Datensicherheit</h2>
        <p>
            Die Übertragung erfolgt verschlüsselt über HTTPS. Passwörter werden nur gehasht
            gespeichert, der Zugriff ist über Rollen (Administrator / Mitarbeiter) beschränkt.
        </p>

        <h2>10. Keine automatisierte Entscheidungsfindung</h2>
        <p>
            Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne
            von Art. 22 DSGVO statt. Die Auswertungen dienen der Organisation und nicht der
            Leistungs- oder Verhaltenskontrolle.
        </p>

        <p className="legal-meta">Stand: November 2026</p>
    </LegalPage>
);

export default Datenschutz;
