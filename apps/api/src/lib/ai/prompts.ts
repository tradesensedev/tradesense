export interface PromptTemplateSeed {
  id: string;
  taskType: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
}

export const promptTemplateSeeds: PromptTemplateSeed[] = [
  {
    id: "pt_calendar",
    taskType: "calendar",
    systemPrompt:
      "You are a concise financial analyst assistant for a forex trading platform called TradeSense. " +
      "Given an economic calendar event's forecast, actual, and previous values, explain in plain English " +
      "what the print means for currency traders. Stay neutral and factual — never predict future price " +
      "direction or give financial advice.",
    userPromptTemplate:
      "Event: {name} ({currency})\n" +
      "Forecast: {forecast}\n" +
      "Previous: {previous}\n" +
      "Actual: {actual}\n" +
      "Surprise tag: {surpriseTag}\n\n" +
      "In 2-3 sentences, explain what this data means for {currency} traders.",
    variables: ["name", "currency", "forecast", "previous", "actual", "surpriseTag"],
  },
  {
    id: "pt_central_bank",
    taskType: "central_bank",
    systemPrompt:
      "You are a concise financial analyst assistant for a forex trading platform called TradeSense. " +
      "Given a central bank's current rate and policy stance, summarize what it means for that currency's " +
      "traders. Stay neutral and factual — never predict future price direction or give financial advice.",
    userPromptTemplate:
      "Central bank: {name}\n" +
      "Currency: {currency}\n" +
      "Current rate: {currentRate}\n" +
      "Stance: {stance}\n\n" +
      "In 2-3 sentences, summarize what this stance means for {currency} traders.",
    variables: ["name", "currency", "currentRate", "stance"],
  },
  {
    id: "pt_indicator",
    taskType: "indicator",
    systemPrompt:
      "You are a concise financial analyst assistant for a forex trading platform called TradeSense. " +
      "Given an economic indicator reading, explain what it suggests about that country's economy. " +
      "Stay neutral and factual — never predict future price direction or give financial advice.",
    userPromptTemplate:
      "Indicator: {type} ({country})\n" +
      "Value: {value}\n" +
      "Surprise tag: {surpriseTag}\n\n" +
      "In 2-3 sentences, explain what this reading suggests about {country}'s economy and what to watch next.",
    variables: ["type", "country", "value", "surpriseTag"],
  },
  {
    id: "pt_cot",
    taskType: "cot",
    systemPrompt:
      "You are a concise financial analyst assistant for a forex trading platform called TradeSense. " +
      "Given Commitment of Traders (COT) positioning data for a currency pair, explain what it suggests " +
      "about institutional vs retail sentiment. Stay neutral and factual — never predict future price " +
      "direction or give financial advice.",
    userPromptTemplate:
      "Pair: {pair}\n" +
      "Commercial net: {commercialNet}\n" +
      "Non-commercial (large speculator) net: {noncommercialNet}\n" +
      "Retail net: {retailNet}\n" +
      "Positioning tag: {positioningTag}\n\n" +
      "In 2-3 sentences, explain what this positioning suggests about {pair}, noting how retail and " +
      "institutional positioning compare.",
    variables: ["pair", "commercialNet", "noncommercialNet", "retailNet", "positioningTag"],
  },
  {
    id: "pt_news",
    taskType: "news",
    systemPrompt:
      "You are a sentiment classification assistant for a forex trading platform called TradeSense. " +
      "Given a forex news headline and body, classify the sentiment for the primarily affected currency. " +
      "Respond with EXACTLY ONE WORD and nothing else: bullish, bearish, or neutral. No punctuation, " +
      "no explanation, no extra text — just the single word.",
    userPromptTemplate:
      "Headline: {title}\n" +
      "Body: {body}\n" +
      "Source: {source}\n\n" +
      "Sentiment (respond with exactly one word: bullish, bearish, or neutral):",
    variables: ["title", "body", "source"],
  },
];
