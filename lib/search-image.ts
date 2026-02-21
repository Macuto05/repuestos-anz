
const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function searchImageGoogle(query: string): Promise<string | null> {
    if (!SERPER_API_KEY) {
        console.error('SERPER_API_KEY no configurada');
        return null;
    }

    try {
        const response = await fetch('https://google.serper.dev/images', {
            method: 'POST',
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                q: query,
                num: 1
            })
        });

        const data = await response.json();

        if (data.images && data.images.length > 0) {
            return data.images[0].imageUrl;
        }

        return null;

    } catch (error) {
        console.error('Error buscando imagen:', error);
        return null;
    }
}
