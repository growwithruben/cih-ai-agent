export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "No message provided"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel"
      });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are CIH SOP Agent for City Insight Houston. Give clear real estate SOP guidance. Include next steps, documents needed, CRM stage, and follow-up task when relevant. If you are unsure, say what information is needed."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.4
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(500).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    const answer =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content
        : "No answer returned from OpenAI.";

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
