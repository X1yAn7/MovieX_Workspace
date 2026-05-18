/**
 * 与后端 /api 配合。若拿到 HTML（常为 API 未就绪、代理未生效或路径打到前端 index.html），给出可读错误。
 */
export async function fetchApiJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const text = await res.text();
  const lower = text.trimStart().slice(0, 16).toLowerCase();
  if (lower.startsWith('<!doctype') || lower.startsWith('<html')) {
    throw new Error(
      'API 返回了网页而不是 JSON。请确认：1) Spring 后端已启动；2) 使用 Vite 开发地址（默认 http://localhost:5173）且 vite.config 里已将 /api 代理到后端；3) 后端已注册对应 /api 路由。'
    );
  }
  if (!res.ok) {
    let msg = text.slice(0, 400) || `请求失败 ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: string; paths?: unknown };
      if (typeof j?.error === 'string') {
        msg = j.paths != null ? `${j.error} ${JSON.stringify(j.paths)}` : j.error;
      }
    } catch {
      /* 非 JSON 则用原始片段 */
    }
    throw new Error(msg);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`返回内容不是合法 JSON：${text.slice(0, 120)}…`);
  }
}
