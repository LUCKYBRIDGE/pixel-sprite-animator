import { GoogleGenAI, Modality } from "@google/genai";
import type { SpriteFrame } from './types';

interface FrameAction {
    name: string;
    description: string;
}

const FRAME_ACTIONS: FrameAction[] = [
  // Idle: 2 frames
  { name: 'idle_01', description: 'a subtle breathing animation, body slightly up, standing still' },
  { name: 'idle_02', description: 'a subtle breathing animation, body slightly down, standing still' },
  // Hurt: 1 frame
  { name: 'hurt_01', description: 'reacting to being hit, knocked back slightly with a pained expression' },
  // Walk: 4 frames
  { name: 'walk_01', description: 'a 4-frame walking animation cycle, right foot forward' },
  { name: 'walk_02', description: 'a 4-frame walking animation cycle, passing pose with left foot back' },
  { name: 'walk_03', description: 'a 4-frame walking animation cycle, left foot forward' },
  { name: 'walk_04', description: 'a 4-frame walking animation cycle, passing pose with right foot back' },
  // Run: 4 frames
  { name: 'run_01', description: 'a 4-frame running animation cycle, leaning forward, right foot forward energetically' },
  { name: 'run_02', description: 'a 4-frame running animation cycle, leaning forward, passing pose, left foot back' },
  { name: 'run_03', description: 'a 4-frame running animation cycle, leaning forward, left foot forward energetically' },
  { name: 'run_04', description: 'a 4-frame running animation cycle, leaning forward, passing pose, right foot back' },
  // Jump: 3 frames
  { name: 'jump_01_takeoff', description: 'preparing to jump, crouching down slightly to gather power' },
  { name: 'jump_02_midair', description: 'in the air at the peak of a jump, legs tucked up' },
  { name: 'jump_03_landing', description: 'landing on the ground, bending knees to absorb impact' },
];

const TOTAL_FRAMES = FRAME_ACTIONS.length;

const urlToGenerativePart = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });
    return {
        inlineData: {
            mimeType: blob.type,
            data: base64data,
        },
    };
};

const fileToGenerativePart = async (file: File) => {
    const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            mimeType: file.type,
            data: base64data,
        },
    };
};


export const generateHistoricalPortrait = async (promptText: string, imageFile: File | undefined, apiKey: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // If an image is provided, use the new multimodal generation
    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        const results: Promise<string>[] = [];

        // Generate 3 variations
        for (let i = 0; i < 3; i++) {
            const promise = (async () => {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro', // Using a powerful model for quality
                    contents: {
                        parts: [
                            imagePart,
                            { text: `**Primary Objective: Create a new portrait of the person in the provided image.**

**CRITICAL INSTRUCTIONS:**
1.  **Preserve Likeness:** The generated portrait MUST be of the *same person* shown in the reference image. Faithfully maintain their key facial features, structure, and identity. This is the highest priority.
2.  **Apply New Context:** Use the following text prompt to define the new context, style, clothing, and setting for the portrait. Do not simply copy the style of the reference image.
3.  **High-Quality Output:** The final image should be a breathtaking, high-quality portrait, similar in quality to a professional digital painting or concept art.

**Text Prompt for Context:** "${promptText}"

This is variation ${i + 1}. The image must NOT contain any text, letters, or numbers.` }
                        ]
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                        temperature: 0.7,
                        topP: 0.95,
                    },
                });
                const part = response.candidates?.[0]?.content?.parts?.[0];
                if (part?.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
                throw new Error(`Failed to generate portrait from image, variation ${i + 1}`);
            })();
            results.push(promise);
        }
        return Promise.all(results);
    } 
    
    // Original text-to-image logic using Imagen
    else {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Create a breathtaking, high-quality portrait based on the user's input: "${promptText}".

The input describes a historical figure and may include other details like attire, actions, setting, or a specific art style (e.g., "한국화", "유화", "sketch").

**CRITICAL INSTRUCTION: The historical figure is the primary subject. All other elements in the prompt, such as "armor" or "royal robes," MUST be interpreted within the historical and cultural context of that specific figure.** The figure's identity is the absolute core of the request, and everything else is a modifier that must be accurate to them. For example, if the input is "Yi Sun-sin, in armor", the armor MUST be an accurate representation of what a Joseon Dynasty admiral would wear, not generic fantasy armor. If the input is "Cleopatra, on a throne", the throne's design must be consistent with Ptolemaic Egypt.

**COMPOSITION & FOCUS INSTRUCTIONS:**
-   **Figure Prominence:** The historical figure is the undeniable focal point. They must be prominently featured and clearly visible, occupying a significant portion of the frame.
-   **Background Subordination:** The background must always be subordinate to the figure. It should complement the subject, not compete for attention. Use compositional techniques like depth of field (blur), atmospheric haze, or simplified details in the background to ensure the figure stands out.
-   **Solo Focus:** The portrait must focus exclusively on the single, specified historical figure. If any secondary figures are included for environmental context (e.g., soldiers in a legion, courtiers in a palace), they must be treated as part of the background. They should be significantly smaller, out of focus, less detailed, and positioned in a way that directs all attention to the primary subject. The main figure should never be lost in a crowd.
-   **No Obscuring:** The figure must not be obscured by environmental elements. Ensure a clear silhouette and view of the character.

**ART STYLE INSTRUCTIONS:**
-   **Adherence to User's Style:** If the user's input specifies an art style (like '한국화', '수채화', '유화', '컨셉 아트'), you MUST render the image in that style. Faithfully capture the essence of the requested style, whether it's the brushstrokes of an oil painting, the delicate washes of watercolor, or the bold lines and ink wash ('먹') of '한국화'.
-   **Default Style:** If no specific style is mentioned, render the portrait in a detailed and polished digital illustration style that feels like masterpiece concept art for a high-end game or film.

Regardless of the style, the portrait should exude a cool, charismatic, and weighty presence. The image must be purely pictorial and must NOT contain any text, letters, numbers, speech bubbles, words, or dialogue.

The absolute, non-negotiable highest priority remains the historical accuracy of the attire, as dictated by the figure's context. The clothing, colors, and insignias must be based on thorough historical research of verified records for their specific time period and status. This means the costume must be a faithful representation, avoiding common anachronisms or fictionalized popular depictions.

Avoid stereotypes and ensure the representation is respectful. The art style should feature cinematic, atmospheric lighting to emphasize their gravitas.`,
            config: {
                numberOfImages: 3,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        return response.generatedImages.map(image => `data:image/png;base64,${image.image.imageBytes}`);
    }
};

export const generatePixelArtOptions = async (portraitUrl: string, apiKey: string): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = await urlToGenerativePart(portraitUrl);
    const results: Promise<string>[] = [];

    for (let i = 0; i < 3; i++) {
        const promise = (async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        imagePart,
                        { text: `Based on the provided portrait, create a full-body pixel art game character.
The art style must be charming and nostalgic, specifically emulating the aesthetic of classic 2D Korean MMORPGs like "MapleStory" or "Nexus: The Kingdom of the Winds (바람의 나라)". This character must adhere to a specific and consistent art style suitable for a cohesive set of game assets.

**STYLE GUIDELINES (CRITICAL):**
1.  **Proportions:** Strictly 3-head-proportion (chibi style). The head should be large and expressive, while the body and limbs are compact.
2.  **Pose & Perspective:** The character must be in a default standing idle pose, viewed from a 3/4 perspective (slightly turned towards the viewer). The stance should be neutral yet confident.
3.  **Outline:** Use a clean, dark, 1-pixel outline to define the character's silhouette and separate it from the background. This is a key feature of the requested style.
4.  **Color & Shading:** Use a vibrant and saturated color palette. Shading must be simple and cel-shaded (hard-edged), with one level of shadow. Avoid dithering or complex gradients.
5.  **Overall Aesthetic:** The character should look like a high-quality game sprite from the golden age of 2D online RPGs.
6.  **Background:** The background MUST be transparent.
7.  **Exclusion:** The image must NOT contain any text, letters, numbers, or watermarks.

The final character must retain the key features, attire, and dignified aura of the original portrait, translated faithfully into this specific pixel art style. This is variation ${i + 1}.` }
                    ]
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            throw new Error(`Failed to generate pixel art option ${i+1}`);
        })();
        results.push(promise);
    }
    return Promise.all(results);
};

export const generateSpriteFrames = async (
    baseCharacterUrl: string, 
    onProgress: (progress: number, message: string) => void,
    apiKey: string,
): Promise<SpriteFrame[]> => {
    const ai = new GoogleGenAI({ apiKey });
    const baseImagePart = await urlToGenerativePart(baseCharacterUrl);
    
    const framePromises = FRAME_ACTIONS.map((action, index) => {
        return (async (): Promise<SpriteFrame> => {
            const prompt = `Based on the provided reference image of a 3-head-proportion pixel art character, generate a new frame for an animation. The new frame should depict the character performing this action: "${action.description}".
            CRITICAL RULES:
            1. The background MUST be transparent.
            2. The pixel art style, color palette, character proportions, lighting, and overall design MUST be identical to the reference image.
            3. The output image dimensions MUST be identical to the reference image.
            4. The image must NOT contain any text, letters, or numbers.
            5. This is for frame "${action.name}".`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [baseImagePart, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                onProgress(((index + 1) / TOTAL_FRAMES) * 100, `Generated ${action.name}`);
                return { name: action.name, url: imageUrl };
            }
            throw new Error(`Failed to generate frame for ${action.name}`);
        })();
    });

    return Promise.all(framePromises);
};
