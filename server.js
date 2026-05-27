require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "front/agente/dist")));

// ============================================================
// BANCO DE DADOS
// ============================================================
const db = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "juridico",
});


// MEMÓRIA DE SESSÕES
const sessions = {};

// ============================================================
// BASE DE CONHECIMENTO JURÍDICO
// ============================================================
const BASE_JURIDICA = `
PENAL(CP): 121 homicídio 6-20a|129 lesão leve 3m-1a|138 calúnia|139 difamação|140 injúria|147 ameaça|148 sequestro 1-3a|150 invasão domicílio|155 furto 1-4a|157 roubo 4-10a|158 extorsão 4-10a|163 dano|168 apropriação indébita|171 estelionato 1-5a|213 estupro 6-10a|329 resistência|330 desobediência|331 desacato
CIVIL(CC): 186 ato ilícito|927 indenização|1228 propriedade|1511-1590 família|1596-1638 filiação/alimentos|1784 herança|1829 vocação hereditária
TRABALHO(CLT/CF): 7CF direitos trabalhistas|59CLT horas extras +50%|477CLT rescisão|483CLT rescisão indireta|487CLT aviso prévio 30d
CONSUMIDOR(CDC): 6 direitos básicos|12 responsabilidade produto|18 vício 30d|26 prazo reclamação|42 cobrança abusiva|49 arrependimento 7d
MARIA DA PENHA(11340): 7 violência doméstica|22 medidas protetivas
ANTIDROGAS(11343): 28 uso próprio sem prisão|33 tráfico 5-15a
CF/88: 5 direitos fundamentais|5LV ampla defesa|5LXVIII habeas corpus|5LXIX mandado segurança
`;

// ============================================================
// PROMPT DO ASSISTENTE
// ============================================================
const SYSTEM_PROMPT = `
Você é a Dra. Lexa, assistente jurídica virtual.

Na PRIMEIRA mensagem de cada conversa, apresente-se:
"Olá! Tudo bem? 😊 Sou a Dra. Lexa, assistente jurídica virtual. Estou aqui para orientar você sobre dúvidas jurídicas de forma clara e acessível. Como posso te ajudar hoje?"

REGRAS:
1. Responda SOMENTE com base na base de conhecimento abaixo
2. Se a pergunta estiver fora do escopo jurídico, diga: "Posso ajudar apenas com questões jurídicas. Poderia reformular sua pergunta?"
3. Cite sempre o artigo de lei quando possível
4. Use linguagem clara, sem juridiquês excessivo
5. SEMPRE oriente a buscar um advogado para o caso concreto
6. Nunca invente leis ou artigos
7. Seja empática e profissional
8. Máximo 4 parágrafos por resposta
9. Ao final de respostas sobre casos específicos, adicione:
"⚠️ Esta é uma orientação educativa. Para seu caso específico, consulte um advogado habilitado."

${BASE_JURIDICA}
`;

// ============================================================
// ROTA: POST /chat
// ============================================================
app.post("/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Campo 'message' é obrigatório" });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: "Mensagem muito longa. Limite: 1000 caracteres." });
  }

  const id = sessionId || "sessao_" + Math.random().toString(36).substr(2, 9);

  if (!sessions[id]) {
    sessions[id] = [{ role: "system", content: SYSTEM_PROMPT }];
  }

  sessions[id].push({ role: "user", content: message });

  // Limita histórico para não estourar contexto
  if (sessions[id].length > 21) {
    sessions[id] = [sessions[id][0], ...sessions[id].slice(-20)];
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: sessions[id],
        temperature: 0.3,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const reply = response.data.choices[0].message.content;
    sessions[id].push({ role: "assistant", content: reply });

    // Salva no banco
    try {
      await db.execute(
        "INSERT INTO conversas (sessao_id, role, message) VALUES (?, ?, ?)",
        [id, "user", message]
      );
      await db.execute(
        "INSERT INTO conversas (sessao_id, role, message) VALUES (?, ?, ?)",
        [id, "assistant", reply]
      );
    } catch (dbErr) {
      console.error("ERRO AO SALVAR NO BANCO:", dbErr.message);
    }

    res.json({ reply, sessionId: id });

  } catch (err) {
    console.error("ERRO GROQ:", err.response?.data || err.message);
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Tempo limite excedido. Tente novamente." });
    }
    res.status(500).json({ error: "Erro no assistente. Tente novamente." });
  }
});

// ============================================================
// ROTA: GET /historico
// ============================================================
app.get("/historico", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM conversas WHERE role = 'user' ORDER BY criado_em DESC LIMIT 30"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROTA: GET /categorias
// ============================================================
app.get("/categorias", async (req, res) => {
  res.json([
    "Direito Penal",
    "Direito Civil",
    "Direito Trabalhista",
    "Direito do Consumidor",
    "Direito Constitucional",
    "Lei Maria da Penha",
    "Lei Antidrogas",
  ]);
});

// ============================================================
// ROTA: DELETE /historico/:id
// ============================================================
app.delete("/historico/:id", async (req, res) => {
  try {
    await db.execute("DELETE FROM conversas WHERE id = ?", [req.params.id]);
    res.json({ message: "Removido com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3001, () => {
    console.log(` Dra. Lexa rodando em http://localhost:${process.env.PORT || 3001}`);
  });
}

module.exports = app;