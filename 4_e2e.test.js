// TESTE 4 — E2E: Fluxo completo do agente
// Rodar: npx jest 4_e2e --verbose

const request = require("supertest");
const app = require("./server");

describe("Teste E2E - Fluxo completo do agente", () => {

  it("E2E-001 | Iniciar conversa e continuar com mesmo sessionId", async () => {
    const passo1 = await request(app)
      .post("/chat")
      .send({ message: "Ola! Quanto e 5 vezes 5?" });

    expect(passo1.status).toBe(200);
    expect(passo1.body).toHaveProperty("sessionId");
    const sessionId = passo1.body.sessionId;

    const passo2 = await request(app)
      .post("/chat")
      .send({ message: "E quanto e 10 + 10?", sessionId });

    expect(passo2.status).toBe(200);
    expect(passo2.body.sessionId).toBe(sessionId);
    expect(typeof passo2.body.reply).toBe("string");
  }, 30000);
});