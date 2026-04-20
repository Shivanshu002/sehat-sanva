const axios = require("axios");

/**
 * Calls Anthropic Claude API
 * Fallback: you can swap this with OpenAI by changing the function body
 */
const callLLM = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("LLM API key not configured. Set ANTHROPIC_API_KEY in .env");
  }

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const rawText = response.data.content[0].text;
  return rawText;
};

/**
 * OpenAI version (uncomment to use instead)
 */
// const callLLM = async (systemPrompt, userPrompt) => {
//   const response = await axios.post(
//     "https://api.openai.com/v1/chat/completions",
//     {
//       model: "gpt-4o",
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: userPrompt },
//       ],
//       max_tokens: 1500,
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   return response.data.choices[0].message.content;
// };

module.exports = { callLLM };