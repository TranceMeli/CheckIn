import { useState, useEffect } from 'react';

const DateTime = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        // BUG WAR: setInterval(() => setDate(new Date(), 1000))
        // 1000 war zweites Argument von setDate, nicht von setInterval
        // FIX:     setInterval(() => setDate(new Date()), 1000)
        const timer = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div>
            <p>Zeit: {date.toLocaleTimeString()}</p>
            <p>Datum: {date.toLocaleDateString()}</p>
        </div>
    );
};

export default DateTime;