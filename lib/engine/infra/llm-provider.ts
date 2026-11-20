import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseLLM } from "../types";

/**
 * ClaudeChatModel: Native Anthropic Claude Client
 * Configured specifically for claude-sonnet-5-5
 */
export class ClaudeChatModel implements BaseLLM {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(options: {
    apiKey: string;
    model?: string;
    baseURL?: string;
  }) {
    this.apiKey = options.apiKey;
    this.model =
      options.model ||
      process.env.CLAUDE_MODEL ||
      process.env.ANTHROPIC_MODEL ||
      "claude-sonnet-5-5";

    this.baseURL =
      options.baseURL ||
      process.env.ANTHROPIC_BASE_URL ||
      process.env.CLAUDE_BASE_URL ||
      "https://api.anthropic.com/v1";
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    console.log(`[ClaudeChatModel] Invoking Claude with model: ${this.model}`);

    // Note: 'temperature' is omitted as it is deprecated for claude-sonnet-5-5
    const body: Record<string, any> = {
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    };

    const res = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ClaudeChatModel] Model ${this.model} returned ${res.status}:`, errText);
      throw new Error(`Claude API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    console.log(
      `[ClaudeChatModel] ✅ SUCCESS: Model '${this.model}' completed. Input tokens: ${data.usage?.input_tokens || 0}, Output tokens: ${data.usage?.output_tokens || 0}`
    );

    const text =
      data.content
        ?.filter((c: any) => c.type === "text")
        ?.map((c: any) => c.text)
        ?.join("\n") || "";

    return { content: text };
  }
}

/**
 * OpenAIChatModel: Native OpenAI/Groq/OpenRouter Client
 */
export class OpenAIChatModel implements BaseLLM {
  private apiKey: string;
  private model: string;
  private baseURL: string;
  private temperature: number;

  constructor(options: {
    apiKey: string;
    model?: string;
    baseURL?: string;
    temperature?: number;
  }) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gpt-4o-mini";
    this.baseURL = options.baseURL || "https://api.openai.com/v1";
    this.temperature = options.temperature ?? 0.2;
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: this.temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content || "" };
  }
}

/**
 * Factory to get the active LLM:
 * 1. Checks ANTHROPIC_API_KEY or CLAUDE_API_KEY -> Uses Claude (default: claude-haiku-5-5)
 * 2. Checks GEMINI_API_KEY, GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY -> Uses Gemini
 * 3. Checks OPENAI_API_KEY -> Uses OpenAI (gpt-4o-mini)
 * 4. Checks GROQ_API_KEY -> Uses Groq (llama-3.3-70b-versatile)
 * 5. Falls back to null (triggers mathematical & rule-based fallbacks)
 */
export function getActiveLLM(): BaseLLM | null {
  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (claudeKey) {
    const claudeModel = process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
    console.log(`[LLM Provider] Using Claude provider with model: ${claudeModel}`);
    return new ClaudeChatModel({
      apiKey: claudeKey,
      model: claudeModel,
    });
  }

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (geminiKey) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    console.log(`[LLM Provider] Using Gemini model: ${geminiModel}`);
    return new ChatGoogleGenerativeAI({
      model: geminiModel,
      apiKey: geminiKey,
      temperature: 0.2,
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    console.log(`[LLM Provider] Using OpenAI model: ${model}`);
    return new OpenAIChatModel({
      apiKey: openAiKey,
      model,
      temperature: 0.2,
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    console.log(`[LLM Provider] Using Groq model: ${model}`);
    return new OpenAIChatModel({
      apiKey: groqKey,
      model,
      baseURL: "https://api.groq.com/openai/v1",
      temperature: 0.2,
    });
  }

  console.warn(
    "[LLM Provider] No LLM API key detected. Running in quantitative mathematical fallback mode."
  );
  return null;
}
