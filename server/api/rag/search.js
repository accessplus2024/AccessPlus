import { useSupabase } from "~/server/utils/supabaseClient.js";
import { marcarCotaAtingida, cotaAtingidaHoje } from "~/server/utils/ragQuota.js";

function normalizeVector(vec) {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map(val => val / magnitude);
}

// Tenta a chamada até 3 vezes se o modelo estiver sobrecarregado (503)
async function gerarComRetry(url, options, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await $fetch(url, options);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const ultimaTentativa = i === tentativas - 1;
      if (status === 503 && !ultimaTentativa) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // espera 1s, depois 2s
        continue;
      }
      throw err;
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  try {
    const textoPergunta = body?.question;

    if (!textoPergunta) {
      setResponseStatus(event, 400);
      return { error: 'A pergunta é obrigatória.' };
    }

    // Se a cota diária já estourou, nem chamamos a IA.
    if (cotaAtingidaHoje()) {
      setResponseStatus(event, 429);
      return { quotaExceeded: true };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let dadosResposta;
    try {
      dadosResposta = await $fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: {
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: textoPergunta }] },
          output_dimensionality: 1024,
          task_type: "RETRIEVAL_QUERY"
        }
      });
    } catch (embedError) {
      const status = embedError?.response?.status || embedError?.status;
      if (status === 429) {
        marcarCotaAtingida();
        setResponseStatus(event, 429);
        return { quotaExceeded: true };
      }
      if (status === 503) {
        // Sobrecarga logo no início: ainda não temos oportunidades para mostrar.
        // Respondemos 200 com a flag para o frontend pedir nova tentativa gentilmente.
        return { overloaded: true, oportunidades: [] };
      }
      throw embedError;
    }

    if (!dadosResposta?.embedding?.values) {
      throw new Error("A API do Google não retornou o formato de embedding esperado.");
    }

    const queryEmbedding = normalizeVector(dadosResposta.embedding.values);

    const supabase = useSupabase();
    const { data: oportunidades, error: errorSupabase } = await supabase.rpc('buscar_oportunidades', {
      query_embedding: queryEmbedding,
      match_threshold: 0.6,
      match_count: 8
    });
    
    if (errorSupabase) {
      setResponseStatus(event, 500);
      return { error: `Erro no banco de dados: ${errorSupabase.message}` };
    }

    const contextoOportunidades = oportunidades
      .map(o => `- ${o.title}: ${o.description}`)
      .join('\n');

    const promptSistema = `Você é a AccessIA, assistente do Access+, um portal de oportunidades acadêmicas para estudantes.

IMPORTANTE: as oportunidades serão exibidas ABAIXO da sua mensagem, em cartões clicáveis. Portanto NÃO liste, NÃO descreva e NÃO repita as oportunidades uma a uma — isso seria redundante.

Sua tarefa é escrever APENAS uma introdução curta e calorosa (2 a 4 frases, no máximo), em português:
1. Cumprimente como "AccessIA" de forma acolhedora.
2. Comente brevemente o perfil e o objetivo do estudante (áreas de interesse, nível), mostrando que entendeu.
3. Diga que separou algumas oportunidades que combinam com ele(a) e que estão logo abaixo.
Não use títulos, listas ou marcadores. Escreva em tom próximo e encorajador, como uma mentora.

(Contexto interno, só para você entender o perfil — NÃO copie na resposta:)
${contextoOportunidades || "Nenhuma oportunidade encontrada para esta busca."}`;

    let respostaGerada;
    try {
      respostaGerada = await gerarComRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
        {
          method: 'POST',
          headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
          body: {
            contents: [
              { role: 'user', parts: [{ text: `Pergunta do estudante: "${textoPergunta}"` }] }
            ],
            systemInstruction: { parts: [{ text: promptSistema }] }
          }
        }
      );
    } catch (apiError) {
      const status = apiError?.response?.status || apiError?.status;
      // 429 = cota diária esgotada → sinaliza para o frontend (sem texto de aviso na resposta).
      if (status === 429) {
        marcarCotaAtingida();
        setResponseStatus(event, 429);
        return { quotaExceeded: true };
      }
      // 503 = a IA está sobrecarregada, mas as oportunidades JÁ foram encontradas no banco.
      // Devolvemos as oportunidades mesmo assim (200), só sem o texto gerado pela IA.
      if (status === 503) {
        return { overloaded: true, oportunidades };
      }
      throw apiError;
    }

    const textoFinal = respostaGerada?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoFinal) {
      throw new Error("A IA não retornou uma resposta em texto.");
    }

    return {
      resposta: textoFinal,
      oportunidades
    };
    
  } catch (error) {
    setResponseStatus(event, 500);
    return { error: error.message };
  }
});