export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "CIH API live",
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasVectorStoreId: !!process.env.OPENAI_VECTOR_STORE_ID,
      vectorStoreIdStart: process.env.OPENAI_VECTOR_STORE_ID
        ? process.env.OPENAI_VECTOR_STORE_ID.slice(0, 8)
        : null
    });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    if (!process.env.OPENAI_VECTOR_STORE_ID) {
      return res.status(500).json({ error: "OPENAI_VECTOR_STORE_ID missing" });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: `You are the CIH SOP Agent.

You MUST answer from the uploaded SOP files using file_search.

If the user asks for a lender, preferred lender, lender contact, phone number, email, CRM stage, checklist, or workflow, search the files first.

If the answer is not found in the uploaded SOP files, say:
"The uploaded SOPs do not currently contain this information."

Do not give generic answers when the user asks what is listed in the SOPs.`
          },
          {
            role: "user",
            content: message
          }
        ],
        tools: [
          {
            type: "file_search",
            vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID]
          }
        ],
        tool_choice: "auto"
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(500).json({
        error: data.error?.message || "OpenAI SOP search failed",
        raw: data
      });
    }

    return res.status(200).json({
      answer: data.output_text || "No SOP answer returned.",
      debug: {
        responseId: data.id,
        outputTypes: data.output?.map(item => item.type) || [],
        vectorStoreIdStart: process.env.OPENAI_VECTOR_STORE_ID.slice(0, 8)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
