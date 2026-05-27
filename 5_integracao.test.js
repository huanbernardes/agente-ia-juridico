// TESTE 5 — INTEGRACAO: Comunicacao da API
// Rodar: npx jest 5_integracao --verbose

const request = require("supertest");
const app = require("./server");

describe("Teste Integracao - Comunicacao da API", () => {

  it("TI-001 | Rota /chat deve existir e aceitar POST", async () => {
    const res = await request(app).post("/chat").send({ message: "teste de integracao" });
    expect(res.status).not.toBe(404);
  }, 15000);

  it("TI-002 | sessionId retornado deve ser string nao vazia", async () => {
    const res = await request(app).post("/chat").send({ message: "verificando sessao" });
    expect(typeof res.body.sessionId).toBe("string");
    expect(res.body.sessionId.length).toBeGreaterThan(0);
  }, 15000);

  it("TI-003 | Duas requisicoes com mesmo sessionId devem manter a sessao", async () => {
    const r1 = await request(app).post("/chat").send({ message: "primeira mensagem" });
    const sessionId = r1.body.sessionId;
    const r2 = await request(app).post("/chat").send({ message: "segunda mensagem", sessionId });
    expect(r2.body.sessionId).toBe(sessionId);
  }, 15000);
});