export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/translate") {
      const formData = await request.formData();
      const prompt = formData.get("prompt");
      return await translatePrompt(prompt, env);
    }
    if (request.method === "POST" && url.pathname === "/generate-image") {
      const formData = await request.formData();
      const prompt = formData.get("prompt");
      return await generateImage(prompt, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function translatePrompt(prompt, env) {
  const messages = [
    {
      role: "system",
      content: `
Translate the following Japanese text into a concise and descriptive English prompt for image generation. Ensure the prompt adheres to the specified artistic style (e.g., oil painting, watercolor, pop art, or other specified), but explicitly exclude any cartoon or comic-style elements. Focus on clearly describing essential subjects, actions, and visual details for the image without introducing elements beyond the original content or style. Output the result as a single English sentence without quotation marks, comments, or additional formatting.
`
    },
    { role: "user", content: prompt },
  ];

  try {
    const stream = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
      messages,
      stream: true,
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("翻訳エラー:", error);
    return new Response(JSON.stringify({ error: "翻訳に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

async function generateImage(prompt, env) {
  const inputs = { prompt };

  try {
    const response = await env.AI.run(
      "@cf/black-forest-labs/flux-1-schnell",
      inputs
    );
    const binaryString = atob(response.image);
    const img = Uint8Array.from(binaryString, (m) => m.codePointAt(0));
    return new Response(img, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  } catch (error) {
    console.error("画像生成エラー:", error);
    return new Response(JSON.stringify({ error: "画像生成に失敗しました。" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
