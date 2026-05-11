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

          input: message,

          instructions:
            `You are the CIH SOP Agent for City Insight Houston.

            Always answer using the uploaded CIH SOP files whenever possible.

            Your job is to guide agents through:
            - residential transactions
            - commercial transactions
            - leasing
            - recruiting
            - compliance
            - onboarding
            - CRM workflows
            - marketing workflows

            Format responses clearly with:
            - headings
            - bullet points
            - step-by-step guidance

            Include:
            - next steps
            - documents needed
            - CRM stage
            - follow-up tasks
            - compliance reminders

            If the SOP does not contain the answer,
            clearly say so instead of making things up.`,

          tools: [
            {
              type: "file_search",

              vector_store_ids: [
                process.env.OPENAI_VECTOR_STORE_ID
              ]
            }
          ]

        })

      }
    );

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {

      return res.status(500).json({
        error:
          data.error?.message ||
          "OpenAI SOP search failed"
      });

    }

    const answer =
      data.output_text ||
      "No SOP answer returned.";

    return res.status(200).json({
      answer
    });

  } catch (error) {

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });

  }

}
