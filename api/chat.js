export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "No message provided"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: `
You are the CIH SOP Agent for City Insight Houston.

Search the uploaded SOP files first.
If the answer exists in the SOPs, return the exact info.
If the SOPs do not contain it, say that clearly.

Format clearly with headings and bullets.
        `,
        input: message,
        tools: [
          {
            type: "file_search",
            vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "OpenAI error",
        raw: data
      });
    }

    let answer = "";

    if (data.output_text) {
      answer = data.output_text;
    }

    if (!answer && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const content of item.content) {
           if (content.text && typeof content.text === "string") {
  answer += content.text + "\n";
}
            }
          }
        }
      }
    }

    if (!answer) {
      answer = "No readable answer found. Raw response: " + JSON.stringify(data);
    }

    return res.status(200).json({
      answer: answer.trim()
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
