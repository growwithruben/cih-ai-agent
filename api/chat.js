export default async function handler(req, res) {

  if (req.method === "GET") {
    return res.status(200).json({
      status: "CIH API live",
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasVectorStoreId: !!process.env.OPENAI_VECTOR_STORE_ID,
      vectorStoreIdStart: process.env.OPENAI_VECTOR_STORE_ID
        ? process.env.OPENAI_VECTOR_STORE_ID.substring(0, 8)
        : null
    });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {

    const body = req.body || {};
    const message = body.message;

    if (!message) {
      return res.status(400).json({
        error: "No message provided"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY missing"
      });
    }

    if (!process.env.OPENAI_VECTOR_STORE_ID) {
      return res.status(500).json({
        error: "OPENAI_VECTOR_STORE_ID missing"
      });
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({

          model: "gpt-4.1-mini",

          input: [
            {
              role: "system",
              content:
                `You are the CIH SOP Agent for City Insight Houston.

                ALWAYS search the uploaded SOP files first before answering.

                If lender names, CRM stages, workflows,
                phone numbers, emails, compliance notes,
                or checklists exist in the SOPs,
                return the EXACT information from the SOP files.

                Do not answer generically if the SOPs contain the answer.

                If the SOP files do not contain the answer,
                clearly say:
                "The uploaded SOPs do not currently contain this information."

                Format responses clearly using:
                - headings
                - bullet points
                - step-by-step instructions`
            },

            {
              role: "user",
              content: message
            }

          ],

          tools: [
            {
              type: "file_search",
              vector_store_ids: [
                process.env.OPENAI_VECTOR_STORE_ID
              ]
            }
          ],

          tool_choice: "auto"

        })

      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {

      return res.status(500).json({
        error:
          data.error && data.error.message
            ? data.error.message
            : "OpenAI SOP search failed",
        raw: data
      });

    }

    let answer = data.output_text;

    if (
      !answer &&
      data.output &&
      data.output[0] &&
      data.output[0].content &&
      data.output[0].content[0]
    ) {
      answer = data.output[0].content[0].text;
    }

    if (
      !answer &&
      data.output &&
      data.output[1] &&
      data.output[1].content &&
      data.output[1].content[0]
    ) {
      answer = data.output[1].content[0].text;
    }

    if (!answer) {
      answer = JSON.stringify(data, null, 2);
    }

    return res.status(200).json({
      answer: answer
    });

  } catch (error) {

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });

  }

}
