// Rate limiter simples, em memória, por janela fixa.
// Limitação conhecida: reseta quando o processo do servidor reinicia, e não é
// compartilhado entre instâncias (relevante em serverless/Vercel com múltiplas
// instâncias). Suficiente para o uso atual (bloquear abuso básico), mas se o
// tráfego crescer vale migrar para algo com estado externo (ex: Redis).

const store = new Map();

export function checkRateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.startedAt > windowMs) {
    store.set(key, { count: 1, startedAt: now });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function getClientIp(event) {
  return (
    event.node.req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.node.req.socket?.remoteAddress ||
    "unknown"
  );
}
