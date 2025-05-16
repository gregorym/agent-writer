import type { NextRequest } from "next/server";

// export const runtime = "edge";
// export const revalidate = 3600 * 24; // 1 day

export async function GET(_req: NextRequest) {
  const url = new URL(_req.url);
  const res = await fetch(`${url.origin}/api/partners`);
  const partners = await res.json();

  const code = `(()=>{try{
    const __agentwriter_data__=${JSON.stringify(partners)};
    const targetElement=document.getElementById('agentwriter-partners');
    if(!targetElement) {console.error('#agentwriter-partners not found'); return; }
    targetElement.innerHTML = '<ul>' + __agentwriter_data__.map(p => '<li><a target="_blank" href="' + p.url + '">' + p.name + '</a></li>').join('') + '</ul>';
  }catch(e){console.error('SEO-widget error',e);}})();`;

  return new Response(code, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
