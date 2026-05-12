export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { message } = req.body;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({

          model: "gpt-4.1-mini",

          input: message,

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

    const data = await response.json();

    console.log(data);

    let answer = "No response returned.";

    if (data.output_text) {
      answer = data.output_text;
    }

    return res.status(200).json({
      answer
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
