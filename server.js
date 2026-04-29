require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// 🧠 Memória em memória (simples para aula)
const sessions = {};

// 🛠️ Tools do agente
const tools = {
  getTime: () => {
    return new Date().toLocaleString();
  },

  calculate: (expression) => {
    try {
      return eval(expression).toString();
    } catch {
      return "Erro ao calcular";
    }
  }
};

// 🎯 Prompt do agente
const SYSTEM_PROMPT = `
Você é um Agente de IA inteligente.

Você pode:
- Conversar naturalmente
- Usar ferramentas quando necessário

TOOLS DISPONÍVEIS:
1. getTime → retorna horário atual
2. calculate(expression) → faz cálculos

Quando precisar usar uma ferramenta, responda no formato:
TOOL: nome_da_tool | argumento

Exemplo:
TOOL: calculate | 2+2

Caso contrário, responda normalmente.
`;

app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  const id = sessionId || uuidv4();

  if (!sessions[id]) {
    sessions[id] = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
  }

  sessions[id].push({ role: "user", content: message });

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: sessions[id]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = response.data.choices[0].message.content;

    // 🛠️ Verifica se é chamada de tool
    if (reply.startsWith("TOOL:")) {
      const [, rest] = reply.split("TOOL:");
      const [toolName, arg] = rest.split("|").map(s => s.trim());

      if (tools[toolName]) {
        const result = tools[toolName](arg);

        // adiciona resultado na memória
        sessions[id].push({
          role: "assistant",
          content: `Resultado da tool ${toolName}: ${result}`
        });

        reply = `🛠️ Resultado: ${result}`;
      } else {
        reply = "Tool não encontrada";
      }
    } else {
      sessions[id].push({ role: "assistant", content: reply });
    }

    res.json({ reply, sessionId: id });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Erro no agente" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🤖 Agente rodando em http://localhost:${process.env.PORT}`);
});