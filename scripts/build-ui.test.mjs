import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const run = vars => spawnSync(process.execPath,['scripts/build-ui.mjs'],{env:{...process.env,VERCEL:'1',...vars},encoding:'utf8'});
test('Build publicado exige API pública e rejeita localhost',()=>{
  assert.notEqual(run({INOVAPAN_API_URL:''}).status,0);
  assert.notEqual(run({INOVAPAN_API_URL:'http://localhost:3000/api'}).status,0);
  assert.notEqual(run({INOVAPAN_API_URL:'https://api.example.com'}).status,0);
});
test('Build gera configuração pública e não publica banco ou servidor',()=>{
  assert.equal(run({INOVAPAN_API_URL:'https://api.example.com/api'}).status,0);
  assert.match(readFileSync('dist/js/config.js','utf8'),/https:\/\/api.example.com\/api/);
  for (const file of ['backend','backend/inovapan.db','.env','.git','render.yaml','README.md']) assert.equal(existsSync('dist/'+file),false,file);
  for (const file of ['index.html','login.html','pedidos.html','vendor/bootstrap.min.css','js/api.js']) assert.ok(existsSync('dist/'+file));
});
