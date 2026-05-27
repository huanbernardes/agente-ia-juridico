// TESTE 3 — NAO FUNCIONAL: Qualidade da API
// Rodar: npx jest 3_nao_funcional --verbose

const request = require("supertest");
const app = require("./server");

describe("Teste Nao Funcional - Qualidade da API", () => {

  it("TNF-001 | Resposta deve ter Content-Type application/json", async () => {
    const res = await request(app).post("/chat").send({ message: "ping" });
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  }, 15000);

  it("TNF-002 | Tempo de resposta deve ser inferior a 10 segundos", async () => {
    const inicio = Date.now();
    await request(app).post("/chat").send({ message: "quanto e 2+2?" });
    const duracao = Date.now() - inicio;
    expect(duracao).toBeLessThan(10000);
  }, 15000);
});

