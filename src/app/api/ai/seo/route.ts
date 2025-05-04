import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Type for SEO generation request
interface SeoGenerationRequest {
  // Original fields for backward compatibility
  title?: string;
  description?: string;
  projectType?: string;
  technologies?: string[];
  features?: string[];
  // New field for direct prompt passing
  prompt?: string;
}

// Type for SEO generation response
interface SeoGenerationResponse {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  socialMediaDescription: string;
}

export async function POST(req: NextRequest) {
  // Add console logging to track API requests
  console.log('SEO generation API called');
  
  try {
    // Check if API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('Missing Gemini API key');
      return NextResponse.json(
        { success: false, message: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Log that we're parsing the request data
    console.log('Parsing request data');
    
    // Get data from request
    let data: SeoGenerationRequest;
    try {
      data = await req.json();
      console.log('Request data received');
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Check if we have either a prompt or the required fields
    if (!data.prompt && (!data.title || !data.description)) {
      console.error('Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Either prompt or title and description are required' },
        { status: 400 }
      );
    }

    try {
      // Initialize the Gemini AI client with safety settings
      console.log('Initializing Gemini AI client');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      
      // Configure the model with safety settings
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ];
      
      // Use the correct model name for the API version
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro", // Updated from gemini-pro to gemini-1.5-pro
        safetySettings
      });

      // Use provided prompt or build one if not provided
      console.log('Preparing prompt');
      let prompt: string;
      
      if (data.prompt) {
        // Use the provided prompt directly
        prompt = data.prompt;
      } else {
        // Build a default prompt from the provided fields
        prompt = `
        You are an SEO expert. Generate optimized SEO content for the following project.
        Respond ONLY with a valid JSON object containing the requested fields.
        
        Project Title: ${data.title || ''}
        Project Description: ${data.description || ''}
        Project Type: ${data.projectType || ''}
        Technologies: ${data.technologies?.join(', ') || ''}
        Features: ${data.features?.join(', ') || ''}
        
        The response must be a valid JSON object with the following structure and nothing else:
        {
          "title": "An SEO-optimized title under 60 characters",
          "description": "An SEO-optimized meta description under 160 characters",
          "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
          "category": "Best matching product category",
          "socialMediaDescription": "A catchy social media description under 200 characters"
        }
        `;
      }

      // Generate content with Gemini AI
      console.log('Calling Gemini API');
      const result = await model.generateContent(prompt);
      console.log('Received response from Gemini API');
      
      // Check for blocked response
      if (result.response.promptFeedback?.blockReason) {
        console.error('Response blocked by safety settings:', result.response.promptFeedback);
        return NextResponse.json(
          { success: false, message: 'Content generation blocked by safety filters' },
          { status: 403 }
        );
      }
      
      // Get the text response
      const text = result.response.text();
      console.log('Raw response:', text);
      
      // Directly try to parse the response as JSON
      try {
        // First try direct parsing
        const seoData = JSON.parse(text) as SeoGenerationResponse;
        
        // Validate the parsed data has all required fields
        if (!seoData.title || !seoData.description || !seoData.keywords || 
            !seoData.category || !seoData.socialMediaDescription) {
          throw new Error('Response missing required fields');
        }
        
        console.log('Successfully parsed SEO data');
        return NextResponse.json({
          success: true,
          data: seoData
        });
      } catch (directParseError) {
        console.error('Error with direct JSON parsing:', directParseError);
        
        // Fall back to regex extraction if direct parsing fails
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[0];
            console.log('Extracted JSON:', jsonStr);
            const seoData = JSON.parse(jsonStr) as SeoGenerationResponse;
            
            // Validate the extracted data
            if (!seoData.title || !seoData.description || !seoData.keywords || 
                !seoData.category || !seoData.socialMediaDescription) {
              throw new Error('Extracted data missing required fields');
            }
            
            console.log('Successfully parsed extracted JSON');
            return NextResponse.json({
              success: true,
              data: seoData
            });
          } catch (extractError) {
            console.error('Error parsing extracted JSON:', extractError);
            throw new Error('Failed to parse extracted JSON');
          }
        } else {
          console.error('No JSON object found in response');
          throw new Error('No JSON object found in response');
        }
      }
    } catch (aiProcessingError) {
      console.error('AI processing error:', aiProcessingError);
      
      // Create default SEO content as fallback
      const title = data.title || '';
      const description = data.description || '';
      const projectType = data.projectType || '';
      const technologies = data.technologies || [];
      
      const defaultSeoData: SeoGenerationResponse = {
        title: title.length > 60 ? title.substring(0, 57) + '...' : title,
        description: description.length > 160 ? description.substring(0, 157) + '...' : description,
        keywords: [...new Set([...technologies, projectType.toLowerCase()])].slice(0, 5),
        category: projectType,
        socialMediaDescription: description.length > 200 ? description.substring(0, 197) + '...' : description
      };
      
      console.log('Returning fallback SEO data');
      return NextResponse.json({
        success: true,
        fallback: true,
        message: 'Using fallback SEO data due to API error',
        data: defaultSeoData
      });
    }
  } catch (error) {
    console.error('Unhandled error in SEO generation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate SEO content', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
