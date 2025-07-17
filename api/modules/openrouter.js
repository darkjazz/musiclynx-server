const request = require("request");
const uris = require("./uris").uris;

const apiKey = process.env.OPENROUTER_API_KEY;
const model = "deepseek/deepseek-chat-v3-0324:free";

const systemPrompt = `
You are a precise and reliable music writer. Supplement and enhance the following DBpedia abstract
for a music artist by adding 3–4 concise sentences that highlight notable aspects of their career,
influence, and unique contributions to music.
Do not invent any facts — only elaborate based on the abstract provided.
Your response must be factually accurate, free of speculation, and stylistically neutral.
`;

module.exports.generate_artist_bio = function (prompt, cb) {
  const options = {
    method: "POST",
    uri: uris.openrouter_uri,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "MusicLynx",
    },
    json: {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: prompt },
      ],
    },
  };

  request(options, (err, res, body) => {
    // console.log(err, body);
    if (err) return cb(err);
    try {
      cb(body.choices[0].message.content);
    } catch (e) {
      cb(new Error("Invalid API response"));
    }
  });
};
