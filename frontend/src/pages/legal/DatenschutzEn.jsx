import LegalPage from "../../components/LegalPage";

// Englische Übersetzung der Datenschutzerklärung. Maßgeblich ist die deutsche Fassung (Datenschutz.jsx).
const DatenschutzEn = () => (
    <LegalPage title="Privacy policy">
        <p className="legal-note">
            Note: CheckIn is a fictional demo project. The controller, contact details and
            retention periods are placeholders and must be replaced with the real details and
            reviewed legally before any real use. All employee data in this application is made-up
            test data. This is an English courtesy translation, the German version is authoritative.
        </p>

        <h2>1. Controller</h2>
        <p>
            Muster Software GmbH, Beispielstraße 1, 12345 Musterstadt, Germany<br />
            Email: datenschutz@checkin.example<br />
            Data protection officer: dsb@checkin.example
        </p>

        <h2>2. Purpose of the application</h2>
        <p>
            CheckIn records the daily work location of employees (office, home office or
            absent) and evaluates this information for work organisation (for example room and
            team planning).
        </p>

        <h2>3. Data processed</h2>
        <div className="legal-table-wrap">
            <table className="legal-table">
                <thead>
                    <tr><th>Data category</th><th>Purpose</th><th>Retention period</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Master data: first and last name, email address, department, role</td>
                        <td>Creating and managing the user account, assigning the evaluations</td>
                        <td>Until the end of employment, then the account is deleted</td>
                    </tr>
                    <tr>
                        <td>Credentials: password (stored as a hash only)</td>
                        <td>Authentication</td>
                        <td>Same as master data</td>
                    </tr>
                    <tr>
                        <td>Check-in data: date, time, status (office / home office / absent)</td>
                        <td>Attendance overview, evaluations, export</td>
                        <td>24 months, then deletion or anonymisation</td>
                    </tr>
                    <tr>
                        <td>Session data: refresh token (cookie and database)</td>
                        <td>Staying signed in, secure session management</td>
                        <td>At most 7 days or until sign-out</td>
                    </tr>
                    <tr>
                        <td>Technical access data (IP address, time, requested address)</td>
                        <td>Operation, error analysis and security of the server</td>
                        <td>At most 14 days</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2>4. Legal bases</h2>
        <p>
            Master, credential and check-in data are processed to carry out the employment
            relationship (Art. 6(1)(b) GDPR in conjunction with § 26 BDSG). We process technical
            access data on the basis of our legitimate interest in a secure and stable operation
            (Art. 6(1)(f) GDPR).
        </p>

        <h2>5. Who has access to your data?</h2>
        <ul className="legal-list">
            <li>Employees see only their own check-in data.</li>
            <li>
                Administrators see check-ins, evaluations and exports of all employees and can
                add check-ins afterwards.
            </li>
            <li>
                Service providers acting on our behalf (processing under Art. 28 GDPR): hosting and
                sending invitation emails. No data is transferred to third countries.
            </li>
        </ul>

        <h2>6. Cookies and local storage</h2>
        <p>
            We use only one technically necessary cookie (“refreshToken”). It is marked HttpOnly
            and Secure, serves only session management and expires after 7 days. No consent is
            required for this under § 25(2) no. 2 TDDDG, which is why there is no cookie banner.
            There is no tracking, no analytics or advertising services and no fonts or scripts
            loaded from third parties. The short-lived access token is kept only in the memory of
            the browser and is not stored permanently. If you choose a language, the browser
            remembers that choice in its local storage (“checkin.lang”). It contains no personal data.
        </p>

        <h2>7. Invitation emails</h2>
        <p>
            New employees receive an email from administrators with a single-use link that lets
            them set their own password.
        </p>

        <h2>8. Your rights</h2>
        <p>Under the GDPR you have the following rights against the controller:</p>
        <ul className="legal-list">
            <li>Access to your stored data (Art. 15)</li>
            <li>Rectification of inaccurate data (Art. 16)</li>
            <li>Erasure (Art. 17)</li>
            <li>Restriction of processing (Art. 18)</li>
            <li>Data portability (Art. 20)</li>
            <li>Objection to processing based on legitimate interests (Art. 21)</li>
        </ul>
        <p>
            To exercise your rights, an email to datenschutz@checkin.example is enough.
            You also have the right to lodge a complaint with a data protection supervisory
            authority (Art. 77 GDPR), for example the data protection commissioner of your
            federal state.
        </p>

        <h2>9. Data security</h2>
        <p>
            Data is transmitted encrypted over HTTPS. Passwords are stored only as hashes and
            access is limited by roles (administrator / employee).
        </p>

        <h2>10. No automated decision-making</h2>
        <p>
            There is no automated decision-making, including profiling, within the meaning of
            Art. 22 GDPR. The evaluations serve organisation and not performance or behaviour
            monitoring.
        </p>

        <p className="legal-meta">As of: November 2026</p>
    </LegalPage>
);

export default DatenschutzEn;
