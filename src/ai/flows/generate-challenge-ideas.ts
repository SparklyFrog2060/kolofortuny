
'use server';
/**
 * @fileOverview A Genkit flow for generating challenge ideas based on a theme or keywords.
 *
 * - generateChallengeIdeas - A function that generates challenge ideas using AI.
 * - GenerateChallengeIdeasInput - The input type for the generateChallengeIdeas function.
 * - GenerateChallengeIdeasOutput - The return type for the generateChallengeIdeas function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateChallengeIdeasInputSchema = z.object({
  theme: z.string().describe('A theme or keywords to generate challenge ideas from.'),
});
export type GenerateChallengeIdeasInput = z.infer<typeof GenerateChallengeIdeasInputSchema>;

const GenerateChallengeIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of generated challenge ideas.'),
  error: z.string().optional().describe('Error message if generation failed.'),
});
export type GenerateChallengeIdeasOutput = z.infer<typeof GenerateChallengeIdeasOutputSchema>;

export async function generateChallengeIdeas(
  input: GenerateChallengeIdeasInput
): Promise<GenerateChallengeIdeasOutput> {
  try {
    return await generateChallengeIdeasFlow(input);
  } catch (error: any) {
    console.error('Genkit Flow Error:', error);
    return { 
      ideas: [], 
      error: error.message?.includes('API key') 
        ? 'Błąd konfiguracji AI: Brak klucza API (GOOGLE_API_KEY) w ustawieniach serwera.' 
        : 'Wystąpił nieoczekiwany błąd podczas generowania pomysłów.' 
    };
  }
}

const generateChallengeIdeasPrompt = ai.definePrompt({
  name: 'generateChallengeIdeasPrompt',
  input: { schema: GenerateChallengeIdeasInputSchema },
  output: { schema: GenerateChallengeIdeasOutputSchema },
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
  prompt: `Jesteś kreatywnym asystentem, który generuje angażujące pomysły na wyzwania do gry "koło fortuny".
Zwróć pomysły jako obiekt JSON z kluczem 'ideas', który jest tablicą ciągów znaków. 
Każdy ciąg powinien być pojedynczym, krótkim wyzwaniem.
Generuj różnorodne i ciekawe wyzwania w języku polskim na podstawie podanego motywu.

Motyw: {{{theme}}}`,
});

const generateChallengeIdeasFlow = ai.defineFlow(
  {
    name: 'generateChallengeIdeasFlow',
    inputSchema: GenerateChallengeIdeasInputSchema,
    outputSchema: GenerateChallengeIdeasOutputSchema,
  },
  async (input) => {
    const { output } = await generateChallengeIdeasPrompt(input);
    if (!output) {
      throw new Error('Nie udało się wygenerować pomysłów.');
    }
    return output;
  }
);
