import { useState, useEffect } from 'react';

const DateTime = () => {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
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