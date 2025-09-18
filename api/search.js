// Ta funkcja jest uruchamiana na serwerach Vercela jako "pośrednik"
export default async function handler(request, response) {
    // Zezwól na zapytania z dowolnej domeny. Dla większego bezpieczeństwa
    // możesz zamienić '*' na adres swojej strony w Sitejet.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Obsługa zapytań wstępnych (preflight)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Przyjmuj tylko zapytania POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Dozwolone tylko zapytania POST' });
    }

    try {
        // Odbierz kod wyszukiwania wysłany z przeglądarki
        const { code } = request.body;
        if (!code) {
            return response.status(400).json({ message: 'Kod jest wymagany' });
        }

        // Pobierz tajny URL i klucz ze zmiennych środowiskowych Vercela
        const googleScriptBaseUrl = process.env.GOOGLE_SCRIPT_URL;
        const googleScriptKey = process.env.GOOGLE_SCRIPT_KEY;

        if (!googleScriptBaseUrl || !googleScriptKey) {
            console.error("Brak zmiennych środowiskowych dla Google Script");
            return response.status(500).json({ message: 'Błąd konfiguracji serwera' });
        }

        // Zbuduj pełny, tajny URL na serwerze
        const finalUrl = `${googleScriptBaseUrl}?code=${encodeURIComponent(code)}&key=${googleScriptKey}`;

        // Wywołaj skrypt Google z serwera Vercela
        const googleResponse = await fetch(finalUrl);

        if (!googleResponse.ok) {
            throw new Error(`Błąd zapytania do Google Script: status ${googleResponse.status}`);
        }

        // Odbierz dane JSON od Google
        const data = await googleResponse.json();

        // Prześlij dane z powrotem do przeglądarki użytkownika
        response.status(200).json(data);

    } catch (error) {
        console.error('Błąd w funkcji wyszukiwania:', error);
        response.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
}
