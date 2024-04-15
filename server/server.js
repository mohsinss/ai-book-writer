const fs = require('fs');
const path = require('path');
const axios = require('axios');
const docx = require('docx');
const readline = require('readline');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const stability_api_key = process.env.STABILITY_API_KEY;

function removeFirstLine(testString) {
  return testString.startsWith("Here") && testString.split("\n")[0].trim().endsWith(":")
    ? testString.replace(/^.*\n/, '')
    : testString;
}

function wordCount(s) {
  return s.match(/\w+/g).length;
}

async function generateText(prompt, model = "claude-3-haiku-20240307", maxTokens = 3000, temperature = 0.7, retries = 5, maxWait = 60) {
  const headers = {
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  };
  const data = {
    model,
    max_tokens: maxTokens,
    temperature,
    system: "You are a world-class author. Write the requested content with great skill and attention to detail.",
    messages: [{ role: "user", content: prompt }],
  };
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post("https://api.anthropic.com/v1/messages", data, { headers });
      if (response.status === 200) {
        const responseText = response.data.content[0].text.trim();
        if (!responseText) {
          throw new Error("Empty response from the model.");
        }
        return responseText;
      } else if (response.status === 429) {
        const wait = Math.min(2 ** attempt, maxWait);
        console.log(`Rate limit exceeded. Retrying in ${wait} seconds...`);
        await new Promise(resolve => setTimeout(resolve, wait * 1000));
      } else {
        throw new Error(`Failed to fetch data from API. Status Code: ${response.status}, Attempt: ${attempt + 1}`);
      }
    } catch (error) {
      console.error(`Error generating text: ${error.message}`);
    }
  }
  throw new Error("Max retries exceeded.");
}

async function generateCoverPrompt(plot) {
  const prompt = `Plot: ${plot}\n\n--\n\nDescribe the cover we should create, based on the plot. This should be visually rich and detailed, ideally two sentences long.`;
  const generatedPrompt = await generateText(prompt);

  if (!generatedPrompt.trim()) {
    throw new Error("Generated prompt is empty.");
  }
  if (generatedPrompt.length > 1000) {
    throw new Error("Generated prompt is too long.");
  }
  if (generatedPrompt.toLowerCase().includes("example_disallowed_content")) {
    throw new Error("Generated prompt contains disallowed content.");
  }

  return generatedPrompt;
}

async function generateTitle(plot) {
  const prompt = `Here is the plot for the book: ${plot}\n\n--\n\nRespond with a great title for this book. Only respond with the title, nothing else is allowed.`;
  return removeFirstLine(await generateText(prompt));
}

async function createCoverImage(plot) {
  const plotDescription = await generateCoverPrompt(plot);
  if (!plotDescription.trim()) {
    throw new Error("Failed to generate a valid description for the cover image.");
  }
  const engineId = "stable-diffusion-xl-beta-v2-2-2";
  const apiHost = process.env.API_HOST || 'https://api.stability.ai';
  const apiKey = stability_api_key;
  const response = await axios.post(
    `${apiHost}/v1/generation/${engineId}/text-to-image`,
    {
      text_prompts: [{ text: plotDescription }],
      cfg_scale: 7,
      clip_guidance_preset: "FAST_BLUE",
      height: 768,
      width: 512,
      samples: 1,
      steps: 30,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    }
  );
  if (response.status !== 200) {
    throw new Error(`Non-200 response: ${response.data}`);
  }
  const imagePath = path.join(__dirname, 'cover.png');
  for (const image of response.data.artifacts) {
    fs.writeFileSync(imagePath, Buffer.from(image.base64, 'base64'));
  }
  return imagePath;
}

async function createDoc(title, author, chapters, chapterTitles, coverImagePath) {
    const docFilename = `${title.replace(/\s/g, '_')}.docx`;
    const docPath = path.join(__dirname, docFilename);
  
    const doc = new docx.Document({
      creator: author,
      description: 'Generated book',
      title: title,
    });
  
    try {
      const imagePath = await createCoverImage(bookDescription);
      const image = docx.Media.addImage(doc, fs.readFileSync(imagePath), 6);
      doc.addSection({
        properties: {},
        children: [
          new docx.Paragraph({
            children: [image],
            alignment: docx.AlignmentType.CENTER,
          }),
        ],
      });
      doc.addSection({
        properties: {},
        children: [new docx.Paragraph({})],
      });
    } catch (error) {
      console.error(`Failed to add cover image: ${error.message}. Continuing without it.`);
    }
  
    doc.addSection({
      properties: {},
      children: [
        new docx.Paragraph({
          text: title,
          heading: docx.HeadingLevel.TITLE,
          alignment: docx.AlignmentType.CENTER,
        }),
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `Author: ${author}\n\n`,
              bold: true,
            }),
          ],
        }),
      ],
    });
  
    for (let i = 0; i < chapters.length; i++) {
      const chapterTitle = chapterTitles.split(', ')[i];
      const chapterContent = chapters[i];
  
      doc.addSection({
        properties: {},
        children: [
          new docx.Paragraph({
            text: chapterTitle,
            heading: docx.HeadingLevel.HEADING_1,
          }),
          ...chapterContent.split('\n').map(paragraph => {
            if (paragraph.trim()) {
              return new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: paragraph.trim(),
                    bold: paragraph.startsWith("Subtitle"),
                    color: paragraph.startsWith("Subtitle") ? "2E8B57" : undefined,
                  }),
                ],
              });
            }
            return null;
          }).filter(Boolean),
        ],
      });
    }
  
    const packer = new docx.Packer();
    const buffer = await packer.toBuffer(doc);
    fs.writeFileSync(docPath, buffer);
    console.log(`Book saved as '${docFilename}'.`);
  }

async function generateBook(writingStyle, bookDescription, chapterTitles) {
  const chapters = [];
  const maxAttempts = 3;

  for (const title of chapterTitles.split(', ')) {
    console.log(`Generating content for chapter '${title}'...`);
    let chapterContent = "";

    for (let subtitleIndex = 1; subtitleIndex <= 2; subtitleIndex++) {
      let attempts = 0;
      let subtitleGenerated = false;
      while (!subtitleGenerated && attempts < maxAttempts) {
        const subtitlePrompt = `Provide a detailed analysis and insights for '${title}', as part of a book in the style of '${writingStyle}'. Ensure this section contains at least 800 words.`;
        const subtitleContent = await generateText(subtitlePrompt, "claude-3-haiku-20240307", 3000);
        if (wordCount(subtitleContent) >= 500) {
          subtitleGenerated = true;
          chapterContent += `${subtitleContent}\n\n`;
        } else {
          attempts++;
          console.log(`Attempting to regenerate content for subtitle ${subtitleIndex} of chapter '${title}' due to insufficient word count. Attempt #${attempts}`);
        }
      }
    }
    chapters.push(chapterContent);
    await new Promise(resolve => setTimeout(resolve, 1000)); // To mitigate potential rate limit issues
  }

  console.log("Book content generation completed.");
  return {
    book: chapters.join("\n\n"),
    chapters
  };
}

async function promptChapterTitles() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question("Enter the titles of chapters, separated by commas: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

(async () => {
  const writingStyle = "Imagine an economist who writes in a style akin to 'Freakonomics,' turning the mundane into the extraordinary with humor and clarity...";
  const bookDescription = "well! This book delves into the hidden economics of daily life, employing a witty and accessible approach to unravel the surprising truths behind ordinary activities...";

  const chapterTitles = await promptChapterTitles();

  const { book, chapters } = await generateBook(writingStyle, bookDescription, chapterTitles);

  const title = await generateTitle(bookDescription);

  await createDoc(title, 'Mohsin Alshammari', chapters, chapterTitles, path.join(__dirname, 'cover.png'));
  console.log(`Book saved as '${title}.docx'.`);
})();