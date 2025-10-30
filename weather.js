// import { tool } from "@langchain/core/tools";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { llm } from "./llm.js";

const getWeather = tool((input) => `It's always sunny in ${input.city}!`, {
  name: "get_weather",
  description: "Get the weather for a given city",
  schema: z.object({
    city: z.string().describe("The city to get the weather for"),
  }),
});

const agent = createAgent({
  model: llm,
  tools: [getWeather],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What's the weather in San Francisco?" }],
});

console.log(result);
