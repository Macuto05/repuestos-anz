
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_GEMINI_API_KEY is not set in environment.');
    process.exit(1);
}

console.log('Testing Gemini API with key: ...' + apiKey.slice(-4));

async function main() {
    try {
        console.log('Fetching available models list...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.log('No models returned.', data);
        }

    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

main();
