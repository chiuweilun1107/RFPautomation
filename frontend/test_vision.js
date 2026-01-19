
const axios = require('axios');

async function testVision() {
    const endpoint = "https://ocrgpt4.openai.azure.com/";
    const deployment = "gpt-4.1";
    const apiVersion = "2025-01-01-preview";
    const apiKey = "ba6946b167174ece95e7419976aa6a33";

    const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const payload = {
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "What is in this image?" },
                    {
                        type: "image_url",
                        image_url: {
                            url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                        }
                    }
                ]
            }
        ],
        max_tokens: 300
    };

    try {
        console.log(`Sending request to ${url}...`);
        const response = await axios.post(url, payload, {
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            }
        });

        console.log("\nSuccess! The model processed the image.");
        console.log("Response:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("\nError occurred:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testVision();
