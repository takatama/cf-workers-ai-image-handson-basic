const translateBtn = document.getElementById("translate-btn");
const genImageBtn = document.getElementById("gen-image-btn");

async function handleEventStream(response, textarea) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    chunk.split("\n").forEach((line) => {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") return;
        try {
          const jsonData = JSON.parse(data);
          text += jsonData.response;
          textarea.value = text;
        } catch (error) {
          // JSONデータが壊れている場合は無視する
        }
      }
    });
  }
}

async function translateText() {
  const errorMessage = document.getElementById("translate-error-message");
  const promptInput = document.getElementById("prompt");

  translateBtn.disabled = true;
  errorMessage.style.display = "none";
  const formData = new FormData();
  formData.set("prompt", promptInput.value);

  try {
    const response = await fetch(`/translate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`エラー ${response.status} ${response.statusText}`);
    }

    const translatedPrompt = document.getElementById("translated-prompt");
    await handleEventStream(response, translatedPrompt);
  } catch (error) {
    console.error("エラー: ", error);
    errorMessage.textContent = "翻訳に失敗しました。もう一度試してください。";
    errorMessage.style.display = "block";
  } finally {
    translateBtn.disabled = false;
  }
}

async function generateImage() {
  genImageBtn.disabled = true;
  const errorMessage = document.getElementById("gen-image-error-message");
  errorMessage.style.display = "none";
  const translatedPrompt = document.getElementById("translated-prompt");
  const formData = new FormData();
  formData.set("prompt", translatedPrompt.value);

  try {
    const response = await fetch(`/generate-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`エラー ${response.status} ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    const img = document.getElementById("generated-image");
    img.src = imageUrl;
    img.style.display = "block";
  } catch (error) {
    console.error("エラー: ", error);
    errorMessage.textContent =
      "画像生成に失敗しました。もう一度試すか、プロンプトを変えてください。";
    errorMessage.style.display = "block";
  } finally {
    genImageBtn.disabled = false;
  }
}
