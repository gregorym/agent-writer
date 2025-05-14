import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// export const runtime = "edge";
export const revalidate = 60 * 60; // Revalidate every 1 hour (3600 seconds)

async function fetchPartners() {
  return await prisma?.website.findMany({
    where: {
      partner: true,
    },
    select: {
      name: true,
      url: true,
    },
  });
}

export async function GET(_req: NextRequest) {
  const partners = await fetchPartners();

  const code = `(()=>{try{
    const __agentwriter_data__=${JSON.stringify(partners)};
    const targetElement=document.getElementById('agentwriter-partners');
    if(!targetElement) {console.error('#agentwriter-partners not found'); return; }
    targetElement.innerHTML=__agentwriter_data__.map(p=>'<a href="'+p.url+'">'+p.name+'</a>').join('');
  }catch(e){console.error('SEO-widget error',e);}})();`;

  return new Response(code, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
