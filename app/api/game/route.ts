import { env } from 'cloudflare:workers';
import terms from '../../../wordbank.json';
import { dayKey,score,shuffled,similarity } from '../../../lib/game';
export const dynamic='force-dynamic';
type Row={id:string;day:string;token:string;name:string;card:string;marks:string;revision:number;updated:number};
function parsed(row:Row){return {...row,card:JSON.parse(row.card) as string[],marks:JSON.parse(row.marks) as Record<string,number>};}
function publicGame(row:Row){const {token,updated,...game}=parsed(row);return {...game,...score(game.marks)};}
function response(data:unknown,status=200,cookie?:string){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});}
function token(req:Request){return req.headers.get('cookie')?.match(/(?:^|; )chem_player=([a-f0-9]{64})(?:;|$)/)?.[1];}
async function id(day:string,t:string){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return day+':'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
async function current(req:Request){const t=token(req);return t?await env.DB!.prepare('SELECT * FROM games WHERE id = ?').bind(await id(dayKey(),t)).first<Row>():null;}
export async function GET(req:Request){try{const day=dayKey();const result=await env.DB!.prepare('SELECT * FROM games WHERE day = ? ORDER BY updated ASC LIMIT 1000').bind(day).all<Row>();const rows=result.results.map(parsed);const players=rows.map(a=>{let match:number|null=null,sameCard=false;for(const b of rows){if(a.id===b.id)continue;const s=similarity(a,b);if(s!==null)match=Math.max(match??0,s);if(a.card.every((x,i)=>b.card[i]===x))sameCard=true;}return {id:a.id,name:a.name,...score(a.marks),similarity:match,sameCard,updated:a.updated};}).sort((a,b)=>b.score-a.score||a.updated-b.updated).slice(0,100).map(({updated,...p})=>p);const own=await current(req);return response({day,players,game:own?publicGame(own):null});}catch{return response({error:'Leaderboard unavailable. Try again.'},503);}}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Invalid request.'},403);
 if(Number(req.headers.get('content-length')||0)>2048)return response({error:'Request too large.'},413);
 try{const text=await req.text();if(text.length>2048)return response({error:'Request too large.'},413);const body=JSON.parse(text),day=dayKey();let t=token(req),cookie:string|undefined;
 if(body.type==='join'){
  if(typeof body.name!=='string')return response({error:'Enter a name or choose anonymous.'},400);
  const name=body.name.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24)||'Anonymous';
  if(!t){t=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');cookie=`chem_player=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`;}
  await env.DB!.prepare('INSERT INTO games (id, day, token, name, card, marks, revision, updated) VALUES (?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name').bind(await id(day,t),day,t,name,JSON.stringify(shuffled(terms)),'{}',Date.now()).run();
 }else if(body.type==='mark'){
  if(!t)return response({error:'Open your card first.'},401);const own=await current(req);if(!own)return response({error:'A new day has started. Reopen your card.'},409);
  if(body.day!==day)return response({error:'New day! Your card has refreshed.',game:publicGame(own)},409);
  if(!Number.isInteger(body.index)||body.index<0||body.index>24||!Number.isInteger(body.revision))return response({error:'Invalid box.'},400);
  if(own.revision!==body.revision)return response({error:'Card updated in another tab. Try again.',game:publicGame(own)},409);
  if(Date.now()-own.updated<200)return response({error:'One box at a time. Try again.'},429);
  const marks=JSON.parse(own.marks);if(marks[body.index])delete marks[body.index];else marks[body.index]=Date.now();
  const result=await env.DB!.prepare('UPDATE games SET marks = ?, revision = revision + 1, updated = ? WHERE id = ? AND revision = ?').bind(JSON.stringify(marks),Date.now(),own.id,body.revision).run();
  if(!result.meta.changes)return response({error:'Card updated in another tab. Try again.'},409);
 }else return response({error:'Unknown action.'},400);
 const row=await env.DB!.prepare('SELECT * FROM games WHERE id = ?').bind(await id(day,t!)).first<Row>();return response({game:publicGame(row!)},200,cookie);
 }catch{return response({error:'Could not save your card. Try again.'},503);}
}
