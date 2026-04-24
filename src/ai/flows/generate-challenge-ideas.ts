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
});
export type GenerateChallengeIdeasOutput = z.infer<typeof GenerateChallengeIdeasOutputSchema>;

export async function generateChallengeIdeas(
  input: GenerateChallengeIdeasInput
): Promise<GenerateChallengeIdeasOutput> {
  return generateChallengeIdeasFlow(input);
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
  prompt: `You are a creative assistant that generates engaging challenge ideas for a 'wheel of fortune' game.
Return the ideas as a JSON object with a single key 'ideas' which is an array of strings. Each string in the array should be a single challenge idea.
Generate diverse and interesting challenge ideas based on the provided theme or keywords.

Theme: {{{theme}}}`,
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
      throw new Error('Failed to generate challenge ideas.');
    }
    return output;
  }
);
