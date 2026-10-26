export const categoryValidationSchema = {
  type: "object",
  properties: {
    source: { type: "string" },
    compiler: { type: "string" },
    language: { type: "string" },
    category_id: { type: "number" },
    category_name: { type: "string" },
    icon_url: {
      anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ],
    },
    total_lectures: { type: "number" },
    lectures: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lecture_id: { type: "number" },
          lecture_name: {
            anyOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          language: { type: "string" },
          year_delivered: { type: "string" },
          season: { type: "string" },
          episode: { type: "string" },
          video_url: { type: "string" },
          video_urls: { type: "array", items: { type: "string" } },
          episodes: { type: "array" },
          pdf_url: {
            anyOf: [
              { type: "string" },
              {
                type: "array",
                items: {
                  anyOf: [
                    { type: "string" },
                    {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                      },
                    },
                  ],
                },
              },
            ],
          },
          pdf_title: { type: "string" },
          icon_url: {
            anyOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          total_ayats: { type: "number" },
          ayat_references: {
            type: "array",
            items: {
              type: "object",
              properties: {
                surah_number: { type: "number" },
                surah_name: { type: "string" },
                ayat_number: { type: "number" },
                arabic_text: { type: "string" },
                english_translation: { type: "string" },
                urdu_translation: { type: "string" },
                hindi_translation: { type: "string" },
                points_notes: { type: "string" },
                points_notes_eng: { type: "string" },
                points_notes_urdu: { type: "string" },
                points_notes_hindi: { type: "string" },
                quest_answer: { type: "boolean" },
                question_text: { type: "string" },
                video_url: { type: ["string", "array"] },
                youtube_url: { type: ["string", "array"] },
                video_urls: { type: "array", items: { type: "string" } },
                youtube_urls: { type: "array", items: { type: "string" } },
                facebook_url: { type: "string" },
              },
              required: ["surah_number", "ayat_number"],
            },
          },
        },
        required: ["lecture_id", "lecture_name"],
      },
    },
  },
  required: ["source", "compiler", "category_id", "category_name"],
  additionalProperties: true,
};
