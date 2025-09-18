import { kv } from '@vercel/kv';

// Ta funkcja jest uruchamiana na serwerach Vercela jako "pośrednik"
export default async function handler(request, response) {
    // Zezwól na zapytania z dowolnej domeny.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Dozwolone tylko zapytania POST' });
    }

    try {
        const { code } = request.body;
        if (!code) {
            return response.status(400).json({ message: 'Kod jest wymagany' });
        }

        // ZMIANA: Stwórz unikalny klucz dla pamięci podręcznej
        const cacheKey = `gcode:${code}`;

        // ZMIANA: Najpierw sprawdź, czy dane są już w pamięci podręcznej
        const cachedData = await kv.get(cacheKey);

        // Jeśli dane znaleziono w cache, zwróć je natychmiast!
        if (cachedData) {
            // Dodajemy nagłówek, żebyś mógł sprawdzić w narzędziach deweloperskich, czy cache zadziałał
            response.setHeader('X-Cache-Status', 'HIT');
            return response.status(200).json(cachedData);
        }

        // Jeśli danych nie ma w cache (CACHE MISS), kontynuuj do Google
        response.setHeader('X-Cache-Status', 'MISS');

        const googleScriptBaseUrl = process.env.GOOGLE_SCRIPT_URL;
        const googleScriptKey = process.env.GOOGLE_SCRIPT_KEY;

        if (!googleScriptBaseUrl || !googleScriptKey) {
            console.error("Brak zmiennych środowiskowych dla Google Script");
            return response.status(500).json({ message: 'Błąd konfiguracji serwera' });
        }

        const finalUrl = `${googleScriptBaseUrl}?code=${encodeURIComponent(code)}&key=${googleScriptKey}`;
        const googleResponse = await fetch(finalUrl);

        if (!googleResponse.ok) {
            throw new Error(`Błąd zapytania do Google Script: status ${googleResponse.status}`);
        }

        const data = await googleResponse.json();

        // ZMIANA: Zapisz wynik w pamięci podręcznej na przyszłość
        // Ustawiamy "czas życia" danych na 1 godzinę (3600 sekund). Możesz to zmienić.
        await kv.set(cacheKey, data, { ex: 3600 });

        // Prześlij dane z powrotem do przeglądarki
        response.status(200).json(data);

    } catch (error) {
        console.error('Błąd w funkcji wyszukiwania:', error);
        response.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
}

