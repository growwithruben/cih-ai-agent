export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are CIH SOP Agent for City Insight Houston. Answer questions using real estate SOP-style guidance. Be clear, step-by-step, and practical. Include next steps, documents needed, CRM stage, and follow-up task when relevant.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    const answer =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "I could not generate a response.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: "AI request failed",
      details: error.message,
    });
  }
}
