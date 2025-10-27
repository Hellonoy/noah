import { GoogleGenAI, Modality, GenerateContentResponse, Content, Type } from "@google/genai";
import { ChatMessage, ImageData, AiChatResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to convert a File object to a base64 string
export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const imageToGenerativePart = (imageData: ImageData) => {
    return {
        inlineData: {
            data: imageData.base64,
            mimeType: imageData.mimeType,
        }
    };
};

export const generateStyledImage = async (originalImage: ImageData, style: string): Promise<string> => {
    try {
        const detailedPrompt = `Use the attached image of the room as the base. Keep the architecture (walls, windows, floors), the layout, and all major furniture pieces exactly as they are. Change only the decorative elements to give the room a ${style} aesthetic. Focus on updating: Wall art, cushions and textiles (throws, curtains), the area rug, plants, small decorative objects (vases, books, candles), and lighting (only the style of the fixtures, not their location). The resulting atmosphere should be fresh, soft, and inviting.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imageToGenerativePart(originalImage),
                    { text: detailedPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating styled image:", error);
        throw new Error("Failed to generate the design. Please try again.");
    }
};

export const removeObjectFromImage = async (currentImage: ImageData, objectDescription: string): Promise<string> => {
    try {
        const removalPrompt = `Use the attached image. Remove ${objectDescription} from the scene. Ensure that the background or surface where the item was located is realistically and seamlessly filled in, matching the surroundings. All other elements in the image must remain unchanged.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imageToGenerativePart(currentImage),
                    { text: removalPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
        }
        throw new Error("No image was generated from the removal.");
    } catch (error) {
        console.error("Error removing object from image:", error);
        throw new Error("Failed to remove the object. Please try again.");
    }
};


export const editImageWithText = async (currentImage: ImageData, prompt: string): Promise<string> => {
    try {
        const editPrompt = `As an AI interior designer, apply this user request: "${prompt}". Your changes should focus only on decorative elements like wall art, vases, cushions, and lighting to create a fresh, soft, and inviting atmosphere. You must maintain the existing architecture and furniture layout.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imageToGenerativePart(currentImage),
                    { text: editPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
            return `data:${firstPart.inlineData.mimeType};base64,${firstPart.inlineData.data}`;
        }
        throw new Error("No image was generated from the edit.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit the design. Please try again.");
    }
};

const getChatResponse = async (chatHistory: ChatMessage[], prompt: string): Promise<AiChatResponse> => {
     try {
        const history: Content[] = chatHistory
            .filter(msg => msg.sender === 'user' || msg.sender === 'ai')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                answer: {
                    type: Type.STRING,
                    description: "The direct, helpful, and concise answer to the user's question, formatted in markdown if necessary."
                },
                suggestions: {
                    type: Type.ARRAY,
                    description: "An array of 3 short, relevant follow-up questions or actions the user might want to ask next.",
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ['answer', 'suggestions']
        };

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction: `You are an AI interior design assistant. A user has an AI-generated image of a room. Your task is to answer questions about it and provide helpful next steps.
- If asked for shopping suggestions for items in the image, provide a fictional list of 2-3 items with descriptive names and brands.
- If asked for style advice or alternative styles, suggest 2-3 other design styles that would also suit the room. Briefly explain why each suggestion would work well.
- For any other design-related questions, answer helpfully and concisely.
- ALWAYS provide a list of 3 short, engaging follow-up questions or actions in the 'suggestions' field of the JSON response. These should anticipate the user's next logical query. Example suggestions: "Tell me more about this style.", "Suggest some wall art.", "Where can I buy a similar rug?".
Do not refer to the user's image unless they mention it. Focus on general design principles and the content of their prompt.`,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
        
        try {
            const jsonResponse = JSON.parse(response.text);
            return jsonResponse as AiChatResponse;
        } catch (e) {
            console.error("Failed to parse JSON response from AI:", response.text, e);
            return {
                answer: "I'm having a little trouble thinking of suggestions right now, but here's my answer:\n\n" + response.text,
                suggestions: []
            };
        }
    } catch (error) {
        console.error("Error getting chat response:", error);
        throw new Error("The design assistant is currently unavailable.");
    }
};

export const processUserRequest = async (
    prompt: string, 
    currentImage: ImageData, 
    chatHistory: ChatMessage[]
): Promise<{type: 'image', data: string} | {type: 'text', data: AiChatResponse}> => {
    
    const intentClassificationPrompt = `Analyze the user's request: "${prompt}".
- If the user wants to remove a specific object, respond with "REMOVE|[the object to remove]". Example: for "please get rid of the plant in the corner", respond "REMOVE|the plant in the corner".
- If the user is asking for a different visual modification (e.g., 'change color', 'add object', 'make it look like...'), respond with "EDIT".
- For all other requests (questions, style advice, shopping links), respond with "CHAT".
Respond with only one of these options. Your response should be a single line.`;

    const intentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: intentClassificationPrompt,
    });
    const intentResult = intentResponse.text.trim();

    if (intentResult.startsWith('REMOVE|')) {
        const objectToRemove = intentResult.substring('REMOVE|'.length);
        const newImageDataUrl = await removeObjectFromImage(currentImage, objectToRemove);
        return { type: 'image', data: newImageDataUrl };
    } else if (intentResult.toUpperCase() === 'EDIT') {
        const newImageDataUrl = await editImageWithText(currentImage, prompt);
        return { type: 'image', data: newImageDataUrl };
    } else { // Assumes CHAT if not EDIT or REMOVE
        const chatResponseData = await getChatResponse(chatHistory, prompt);
        return { type: 'text', data: chatResponseData };
    }
};