// Ta funkcja jest uruchamiana na serwerach Vercela, a nie w przeglądarce!
export default function handler(request, response) {
    // --- WAŻNE: Zezwól na zapytania z Twojej strony Sitejet ---
    // PAMIĘTAJ: Jeśli masz własną domenę, wpisz ją tutaj zamiast adresu sitejet.
    response.setHeader('Access-Control-Allow-Origin', '*'); // Dla testów można dać '*', potem zmień na swoją domenę
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Obsługa zapytań wstępnych (preflight) przeglądarki
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // Sprawdzamy, czy żądanie jest typu POST
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Tylko żądania POST są dozwolone' });
    }

    // Odczytujemy hasło, które użytkownik wysłał z formularza
    const { password } = request.body;

    // Pobieramy POPRAWNE hasło z bezpiecznych zmiennych środowiskowych Vercela
    const correctPassword = process.env.PAGE_PASSWORD;

    // Porównujemy hasła
    if (password === correctPassword) {
        // Hasło jest poprawne! Wyślij odpowiedź "OK" (status 200).
        response.status(200).json({ message: 'Logowanie udane' });
    } else {
        // Hasło jest błędne. Wyślij błąd "Brak autoryzacji" (status 401).
        response.status(401).json({ message: 'Nieprawidłowe hasło' });
    }
}
