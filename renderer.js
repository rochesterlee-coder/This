const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let xp = 0, coins = 0, currentGame = 'home', cleanupGame = null;
const pageTitles = {home:'Choose your next adventure',snake:'Snake Battle', '2048':'2048',brick:'Brick Breaker',grammar:'Grammar Rush',tetris:'Tetris',sudoku:'Sudoku',flappy:'Flappy Flyer',math:'Math Sprint',settings:'Settings & Performance'};
function addRewards(amount, coinAmount=1){if(settings.sfx)tone(740,.045,'sine',.025);xp+=amount;coins+=coinAmount;$('#xpTotal').textContent=xp;$('#coinTotal').textContent=coins;const level=Math.floor(xp/100)+1;$('#levelText').textContent='LEVEL '+level;$('#xpBar').style.width=(xp%100)+'%';$('#xpText').textContent=(xp%100)+' / 100 XP to next level';}
function stopGame(){if(cleanupGame){cleanupGame();cleanupGame=null;} $('#gameArea').innerHTML='';}
function showPage(page){stopGame();currentGame=page;$('#homePage').classList.toggle('hidden',page!=='home');$('#gamePage').classList.add('hidden');$('#settingsPage').classList.toggle('hidden',page!=='settings');$('#pageTitle').textContent=pageTitles[page]||pageTitles.home;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='settings')refreshNetwork();}
function goHome(){showPage('home');}
function launch(game){if(game==='settings'){showPage('settings');return;}stopGame();currentGame=game;$('#homePage').classList.add('hidden');$('#settingsPage').classList.add('hidden');$('#gamePage').classList.remove('hidden');$('#pageTitle').textContent=pageTitles[game];$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===game));$('#gameStatus').textContent='READY TO PLAY';$('#restartBtn').onclick=()=>launch(game);if(game==='snake')renderSnake();if(game==='2048')render2048();if(game==='brick')renderBrick();if(game==='grammar')renderGrammar();if(game==='tetris')renderTetris();if(game==='sudoku')renderSudoku();if(game==='flappy')renderFlappy();if(game==='math')renderMathSprint();}
// Use delegated click handling so navigation still works if cards/buttons are
// recreated by the UI or their inner text/icon is what gets clicked.
document.addEventListener('click', e => {
  const pageButton = e.target.closest('[data-page]');
  if (pageButton) {
    e.preventDefault();
    const page = pageButton.dataset.page;
    if (page === 'home') goHome(); else launch(page);
    return;
  }
  const launchButton = e.target.closest('[data-launch]');
  if (launchButton) {
    e.preventDefault();
    launch(launchButton.dataset.launch);
    return;
  }
  if (e.target.closest('#backHome')) {
    e.preventDefault();
    goHome();
  }
});

function renderSnake(){
 $('#gameIntro').innerHTML='<h2>Snake Battle <span style="color:#55e6e9">/ AI Arena</span></h2><p>Eat glowing orbs, grow longer, and bait AI snakes into crashing into your body. Your head must avoid every snake body.</p><div class="mode-row"><button class="mode-btn selected" data-mode="easy">🟢 Easy</button><button class="mode-btn" data-mode="hard">🟠 Hard</button><button class="mode-btn" data-mode="devil">😈 Devil</button></div>';
 $('#gameArea').innerHTML='<div class="snake-layout"><div><canvas id="snakeCanvas" class="snake-board" width="600" height="420"></canvas><div class="game-actions"><button class="game-btn" id="snakeStart">▶ Start battle</button><button class="game-btn alt" id="snakePause">Ⅱ Pause</button></div><div class="touch-controls"><button data-dir="up">▲</button><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div></div><div class="side-panel"><div class="mini-stat"><small>YOUR LENGTH</small><b id="snakeLength">5</b></div><div class="mini-stat"><small>AI SNAKES LEFT</small><b id="snakeEnemies">6</b></div><div class="mini-stat"><small>ORBS EATEN</small><b id="snakeEaten">0</b></div><div class="mini-stat"><small>DIFFICULTY</small><b id="snakeMode">EASY</b><p class="mode-description" id="modeDescription">Slower AI and fewer opponents. Great for learning the controls.</p></div><div class="mode-description">Controls: Move your cursor over the arena to steer toward it, or use arrows / WASD. AI snakes plan safer routes.</div></div></div><div class="game-message" id="snakeMessage">Pick a difficulty, then start your battle.</div>';
 const canvas=$('#snakeCanvas'),ctx=canvas.getContext('2d'),cell=15,cols=40,rows=28;
 let mode='easy',running=false,over=false,paused=false,timer=null,dir={x:1,y:0},nextDir={x:1,y:0},player=[],ais=[],orbs=[],eaten=0,lastTick=0;
 const configs={easy:{ai:3,speed:115,brain:.35,name:'Slower AI and fewer opponents. Great for learning the controls.'},hard:{ai:6,speed:85,brain:.65,name:'Faster AI that hunts orbs and tries to cut you off.'},devil:{ai:9,speed:62,brain:.95,name:'Fast, aggressive AI and a crowded arena. Good luck.'}};
 function randPos(){return{x:2+Math.floor(Math.random()*(cols-4)),y:2+Math.floor(Math.random()*(rows-4))};}
 function newSnake(x,y,color,len=5){return{body:Array.from({length:len},(_,i)=>({x:x-i,y})),dir:{x:1,y:0},color,alive:true,think:0};}
 function reset(){running=false;over=false;paused=false;clearInterval(timer);dir={x:1,y:0};nextDir={x:1,y:0};player=newSnake(10,14,'#54f4c2',5);ais=[];for(let i=0;i<configs[mode].ai;i++){let p=randPos();let s=newSnake(p.x,p.y,['#ff6b9d','#a78bfa','#ffc85e','#5acbff','#ff8a5c','#8bff70','#f58bff','#6af0e2','#ff6870'][i%9],4+Math.floor(Math.random()*4));s.dir={x:Math.random()>.5?1:-1,y:0};ais.push(s);}orbs=Array.from({length:22},randPos);eaten=0;$('#snakeLength').textContent=player.body.length;$('#snakeEnemies').textContent=ais.length;$('#snakeEaten').textContent='0';$('#snakeMessage').textContent='Ready! Eat the glowing orbs and outmaneuver the AI.';draw();}
 function occupied(p){return player.body.some(s=>s.x===p.x&&s.y===p.y)||ais.some(a=>a.alive&&a.body.some(s=>s.x===p.x&&s.y===p.y));}
 function addOrb(){let p;do{p=randPos()}while(occupied(p));orbs.push(p);}
 function turn(x,y){if(!running||paused||over)return;if(x===-dir.x&&y===-dir.y)return;nextDir={x,y};}
 canvas.addEventListener('mousemove',e=>{if(!running||paused||over)return;const r=canvas.getBoundingClientRect(),tx=Math.floor((e.clientX-r.left)/r.width*cols),ty=Math.floor((e.clientY-r.top)/r.height*rows),h=player.body[0];const dx=tx-h.x,dy=ty-h.y;let choices=Math.abs(dx)>Math.abs(dy)?[[Math.sign(dx),0],[0,Math.sign(dy)]]:[[0,Math.sign(dy)],[Math.sign(dx),0]];for(const [x,y] of choices){if((x||y)&&!(x===-dir.x&&y===-dir.y)){nextDir={x,y};break;}}});
 function key(e){const k=e.key.toLowerCase();const map={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};if(map[k]){e.preventDefault();turn(...map[k]);}}
 window.addEventListener('keydown',key);
 $$('[data-dir]').forEach(b=>b.onclick=()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];turn(...d)});
 function aiTurn(s){
   const head=s.body[0],cfg=configs[mode];
   const choices=[[1,0],[-1,0],[0,1],[0,-1]].filter(([x,y])=>!(x===-s.dir.x&&y===-s.dir.y));
   const target=orbs.reduce((best,o)=>!best||Math.abs(o.x-head.x)+Math.abs(o.y-head.y)<Math.abs(best.x-head.x)+Math.abs(best.y-head.y)?o:best,null);
   let scored=choices.map(([x,y])=>{
     const p={x:head.x+x,y:head.y+y};let score=0;
     if(p.x<1||p.x>=cols-1||p.y<1||p.y>=rows-1)score-=10000;
     if(bodyAt(p,s))score-=10000;
     // Avoid nearby body segments and prefer moves with more free neighbouring cells.
     let free=0;for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+ax,y:p.y+ay};if(q.x>0&&q.x<cols-1&&q.y>0&&q.y<rows-1&&!bodyAt(q,s))free++;}
     score+=free*5;
     if(target)score-=(Math.abs(target.x-p.x)+Math.abs(target.y-p.y))*(Math.random()<cfg.brain?1.8:0.65);
     // Prefer not to turn needlessly; keep momentum when it is safe.
     if(x===s.dir.x&&y===s.dir.y)score+=1.5;
     score+=Math.random()*1.2;
     return {x,y,score};
   }).sort((a,b)=>b.score-a.score);
   if(scored.length&&scored[0].score>-5000)s.dir={x:scored[0].x,y:scored[0].y};
 }
 function bodyAt(p,self){if(player.body.some((q,i)=>i<player.body.length-1&&q.x===p.x&&q.y===p.y))return true;return ais.some(a=>a!==self&&a.alive&&a.body.some(q=>q.x===p.x&&q.y===p.y));}
 function moveSnake(s,isPlayer){if(!s.alive)return;let d=isPlayer?nextDir:s.dir;if(isPlayer)dir=d;let h={x:s.body[0].x+d.x,y:s.body[0].y+d.y};let wall=h.x<0||h.x>=cols||h.y<0||h.y>=rows;let collision=false;
   const all=[{body:player.body,alive:player.alive},...ais.map(a=>({body:a.body,alive:a.alive}))];
   for(const a of all){if(!a.alive)continue;for(let i=0;i<a.body.length;i++){if(a.body[i].x===h.x&&a.body[i].y===h.y){if(a.body===s.body&&i===a.body.length-1)continue;collision=true;break;}}if(collision)break;}
   if(wall||collision){s.alive=false;if(isPlayer){end(false);return;}return;}
   s.body.unshift(h);let idx=orbs.findIndex(o=>o.x===h.x&&o.y===h.y);if(idx>=0){orbs.splice(idx,1);addOrb();if(isPlayer){eaten++;$('#snakeEaten').textContent=eaten;$('#snakeLength').textContent=s.body.length;addRewards(2,1);}}else s.body.pop();
 }
 function tick(){if(!running||paused||over)return;ais.forEach(ai=>{if(ai.alive)aiTurn(ai)});moveSnake(player,true);if(over)return;ais.forEach(ai=>moveSnake(ai,false));ais=ais.filter(a=>a.alive);$('#snakeEnemies').textContent=ais.length;draw();if(ais.length===0)end(true);}
 function end(win){over=true;running=false;clearInterval(timer);$('#gameStatus').textContent=win?'ARENA CLEARED':'BATTLE OVER';$('#snakeMessage').textContent=win?'🏆 You outlasted every AI snake! Bonus XP earned.':'💥 Your snake crashed! Restart and try a different strategy.';if(win)addRewards(40,10);else addRewards(5,1);}
 function draw(){ctx.fillStyle='#081225';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#12203a';ctx.lineWidth=.5;for(let x=0;x<=cols;x++){ctx.beginPath();ctx.moveTo(x*cell,0);ctx.lineTo(x*cell,rows*cell);ctx.stroke()}for(let y=0;y<=rows;y++){ctx.beginPath();ctx.moveTo(0,y*cell);ctx.lineTo(cols*cell,y*cell);ctx.stroke()}
   orbs.forEach(o=>{ctx.fillStyle='#65f5ec';ctx.shadowColor='#65f5ec';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(o.x*cell+cell/2,o.y*cell+cell/2,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
   function snake(s){if(!s.alive)return;s.body.forEach((p,i)=>{ctx.fillStyle=i===0?'#f7ffff':s.color;ctx.shadowColor=s.color;ctx.shadowBlur=i===0?8:2;ctx.beginPath();ctx.roundRect(p.x*cell+1,p.y*cell+1,cell-2,cell-2,4);ctx.fill();if(i===0){ctx.fillStyle='#0a1530';ctx.fillRect(p.x*cell+4,p.y*cell+4,2,2);ctx.fillRect(p.x*cell+9,p.y*cell+4,2,2);}});ctx.shadowBlur=0;}
   ais.forEach(snake);snake(player);ctx.fillStyle='#8392b6';ctx.font='10px sans-serif';ctx.fillText('GAMECADE ARENA',10,14);}
 function start(){if(over||!player.length)reset();running=true;paused=false;$('#gameStatus').textContent='BATTLE LIVE';$('#snakeMessage').textContent='Battle live — make the AI hit your body!';clearInterval(timer);timer=setInterval(tick,configs[mode].speed);}
 function setMode(m){mode=m;$$('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));$('#snakeMode').textContent=m.toUpperCase();$('#modeDescription').textContent=configs[m].name;reset();}
 $$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('#snakeStart').onclick=start;$('#snakePause').onclick=()=>{if(!running)return;paused=!paused;$('#snakePause').textContent=paused?'▶ Resume':'Ⅱ Pause';$('#gameStatus').textContent=paused?'PAUSED':'BATTLE LIVE';};
 reset();cleanupGame=()=>{clearInterval(timer);window.removeEventListener('keydown',key);};
}

function render2048(){
 $('#gameIntro').innerHTML='<h2>2048 <span style="color:#c29cff">/ Number Merge</span></h2><p>Use the arrow keys or WASD to slide every tile. Matching numbers merge into one — reach 2048 to win.</p>';
 $('#gameArea').innerHTML='<div class="puzzle-wrap"><div class="puzzle-top"><div class="score-box"><small>SCORE</small><b id="puzzleScore">0</b></div><button class="game-btn" id="newPuzzle">New game</button><div class="score-box"><small>BEST</small><b id="puzzleBest">0</b></div></div><div id="tileBoard" class="tile-board"></div><div id="puzzleMessage" class="game-instructions">Use ← ↑ → ↓ or WASD to play.</div></div>';
 let board,score,best=Number(localStorage.getItem('aplus2048best')||0),won=false,ended=false;
 const boardEl=$('#tileBoard');
 function spawn(){let empty=[];board.forEach((v,i)=>{if(!v)empty.push(i)});if(empty.length){let i=empty[Math.floor(Math.random()*empty.length)];board[i]=Math.random()<.9?2:4;}}
 function reset(){board=Array(16).fill(0);score=0;won=false;ended=false;spawn();spawn();draw();$('#puzzleMessage').textContent='Use ← ↑ → ↓ or WASD to play.';}
 function draw(){boardEl.innerHTML='';board.forEach(v=>{let d=document.createElement('div');d.className='tile-cell'+(v?' filled v'+v:'');d.textContent=v||'';boardEl.appendChild(d)});$('#puzzleScore').textContent=score;$('#puzzleBest').textContent=best;}
 function slide(line){let arr=line.filter(v=>v),out=[];for(let i=0;i<arr.length;i++){if(arr[i]===arr[i+1]){out.push(arr[i]*2);score+=arr[i]*2;i++;}else out.push(arr[i]);}while(out.length<4)out.push(0);return out;}
 function move(dir){if(ended)return;let old=board.join(',');for(let n=0;n<4;n++){let line=[];for(let i=0;i<4;i++){let idx=dir==='left'?n*4+i:dir==='right'?n*4+3-i:dir==='up'?i*4+n:(3-i)*4+n;line.push(board[idx]);}let result=slide(line);for(let i=0;i<4;i++){let idx=dir==='left'?n*4+i:dir==='right'?n*4+3-i:dir==='up'?i*4+n:(3-i)*4+n;board[idx]=result[i];}}
 if(old!==board.join(',')){spawn();if(score>best){best=score;localStorage.setItem('aplus2048best',best)}draw();addRewards(1,0);if(board.includes(2048)&&!won){won=true;$('#puzzleMessage').textContent='🎉 You made 2048! Keep going for a bigger tile.';addRewards(30,8);}else if(!board.some(v=>!v)&&!canMove()){$('#puzzleMessage').textContent='No moves left — start a new game!';ended=true;} }}
 function canMove(){for(let r=0;r<4;r++)for(let c=0;c<4;c++){let i=r*4+c;if(c<3&&board[i]===board[i+1]||r<3&&board[i]===board[i+4])return true;}return false;}
 function key(e){let map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};if(map[e.key.toLowerCase()]){e.preventDefault();move(map[e.key.toLowerCase()]);}}
 window.addEventListener('keydown',key);$('#newPuzzle').onclick=reset;reset();cleanupGame=()=>window.removeEventListener('keydown',key);
}
function renderBrick(){
 $('#gameIntro').innerHTML='<h2>Brick Breaker <span style="color:#ff8ca9">/ Neon Smash</span></h2><p>Move your paddle to bounce the ball into every brick. Use your mouse, trackpad, or arrow keys. Don’t let the ball fall!</p>';
 $('#gameArea').innerHTML='<div class="brick-wrap"><canvas id="brickCanvas" class="brick-canvas" width="650" height="390"></canvas><div style="display:flex;gap:24px;color:#a9b7d8;font-size:11px"><span>SCORE <b id="brickScore" style="color:#fff">0</b></span><span>LIVES <b id="brickLives" style="color:#fff">3</b></span><span>LEVEL <b id="brickLevel" style="color:#fff">1</b></span></div><div class="game-actions"><button class="game-btn" id="brickStart">▶ Start / Resume</button><button class="game-btn alt" id="brickRestart">↻ New game</button></div><div class="game-instructions" id="brickMessage">Move the mouse or use ← → to move your paddle.</div></div>';
 const c=$('#brickCanvas'),ctx=c.getContext('2d');let raf=null,running=false,over=false,score=0,lives=3,level=1,paddle={x:275,y:365,w:100,h:10},ball={x:325,y:340,dx:3,dy:-3,r:7},keys={},bricks=[];
 function makeBricks(){bricks=[];for(let r=0;r<4+Math.min(level,2);r++)for(let col=0;col<10;col++)bricks.push({x:13+col*63,y:35+r*23,w:55,h:15,alive:true,color:['#51dce7','#8e75ff','#ff6e9b','#ffc96b','#69e6b1'][r%5]});}
 function reset(){if(raf)cancelAnimationFrame(raf);running=false;over=false;score=0;lives=3;level=1;paddle.x=275;ball={x:325,y:340,dx:3,dy:-3,r:7};makeBricks();draw();$('#brickScore').textContent=score;$('#brickLives').textContent=lives;$('#brickLevel').textContent=level;$('#brickMessage').textContent='Move the mouse or use ← → to move your paddle.';}
 function draw(){ctx.fillStyle='#090f25';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#243152';ctx.fillRect(0,0,c.width,1);bricks.forEach(b=>{if(!b.alive)return;ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,4);ctx.fill();ctx.shadowBlur=0;});ctx.fillStyle='#7c91ff';ctx.shadowColor='#7c91ff';ctx.shadowBlur=15;ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6);ctx.fill();ctx.fillStyle='#fff';ctx.shadowColor='#4ee8ff';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#7181a8';ctx.font='10px sans-serif';ctx.fillText('GAMECADE NEON SMASH',14,18);}
 function frame(){if(!running||over)return;if(keys.left)paddle.x-=7;if(keys.right)paddle.x+=7;paddle.x=Math.max(0,Math.min(c.width-paddle.w,paddle.x));ball.x+=ball.dx;ball.y+=ball.dy;if(ball.x<ball.r||ball.x>c.width-ball.r)ball.dx*=-1;if(ball.y<ball.r)ball.dy=Math.abs(ball.dy);if(ball.y+ball.r>=paddle.y&&ball.x>=paddle.x&&ball.x<=paddle.x+paddle.w&&ball.dy>0){ball.dy=-Math.abs(ball.dy);ball.dx=((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*4.2;}
 for(let b of bricks){if(b.alive&&ball.x>b.x&&ball.x<b.x+b.w&&ball.y-ball.r<b.y+b.h&&ball.y+ball.r>b.y){b.alive=false;ball.dy*=-1;score+=10;$('#brickScore').textContent=score;addRewards(1,0);break;}}
 if(ball.y>c.height){lives--;$('#brickLives').textContent=lives;if(lives<=0){over=true;running=false;$('#brickMessage').textContent='Game over! Score: '+score+'. Start a new game to try again.';$('#gameStatus').textContent='GAME OVER';addRewards(5,2);}else ball={x:paddle.x+paddle.w/2,y:340,dx:3,dy:-3};}
 if(bricks.every(b=>!b.alive)){level++;$('#brickLevel').textContent=level;makeBricks();ball.dx*=1.12;ball.dy*=1.12;$('#brickMessage').textContent='Level '+level+' — nice smashing!';addRewards(20,5);}
 draw();if(!over)raf=requestAnimationFrame(frame);}
 function start(){if(over)return;running=true;$('#gameStatus').textContent='GAME LIVE';$('#brickMessage').textContent='Smash those bricks!';if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}
 function keydown(e){if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys[e.key==='ArrowLeft'?'left':'right']=true;}}function keyup(e){if(['ArrowLeft','ArrowRight'].includes(e.key))keys[e.key==='ArrowLeft'?'left':'right']=false;}
 function mouse(e){const rect=c.getBoundingClientRect();paddle.x=((e.clientX-rect.left)/rect.width)*c.width-paddle.w/2;}
 c.addEventListener('mousemove',mouse);c.addEventListener('touchmove',e=>{e.preventDefault();const rect=c.getBoundingClientRect();paddle.x=((e.touches[0].clientX-rect.left)/rect.width)*c.width-paddle.w/2;},{passive:false});window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);$('#brickStart').onclick=start;$('#brickRestart').onclick=reset;reset();cleanupGame=()=>{if(raf)cancelAnimationFrame(raf);c.removeEventListener('mousemove',mouse);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);};
}
const questions=[
{q:'She ___ to school every morning.',a:['go','goes','going','gone'],c:1,e:'Use “goes” with he, she, or it in the simple present.'},
{q:'Which sentence is correct?',a:['They is happy.','They am happy.','They are happy.','They be happy.'],c:2,e:'“They” pairs with “are.”'},
{q:'My brother ___ like spicy food.',a:['don’t','doesn’t','isn’t','aren’t'],c:1,e:'Use “doesn’t” with a singular third-person subject.'},
{q:'We have lived here ___ 2020.',a:['for','since','during','from'],c:1,e:'Use “since” with the starting point of a period.'},
{q:'Choose the correct past tense of “teach.”',a:['teached','taught','teaching','teaches'],c:1,e:'“Teach” is irregular; its past tense is “taught.”'},
{q:'Which word is an adjective?',a:['quickly','happiness','bright','swim'],c:2,e:'“Bright” describes a noun, so it is an adjective.'},
{q:'There ___ three apples on the table.',a:['is','am','are','be'],c:2,e:'Use “are” with the plural noun “three apples.”'},
{q:'Choose the correctly punctuated sentence.',a:['Where are you.','Where are you?','Where are you,','Where are you!'],c:1,e:'A direct question normally ends with a question mark.'},
{q:'The cat is hiding ___ the bed.',a:['under','quickly','because','happy'],c:0,e:'“Under” is a preposition showing position.'},
{q:'If I ___ time, I will help you.',a:['have','had yesterday','has','having'],c:0,e:'In this first conditional, use the present simple after “if.”'},
{q:'Choose the correct plural of “child.”',a:['childs','childes','children','childrens'],c:2,e:'“Children” is the irregular plural of “child.”'},
{q:'Which sentence uses “your” correctly?',a:['Your welcome!','Is this your pencil?','Your going home.','I saw your yesterday.'],c:1,e:'“Your” shows possession: the pencil belongs to you.'},
{q:'He has ___ his homework already.',a:['finish','finished','finishing','finishes'],c:1,e:'Present perfect uses has/have + past participle.'},
{q:'Which is a synonym for “rapid”?',a:['slow','quiet','fast','late'],c:2,e:'“Rapid” means very fast or quick.'},
{q:'Neither of the answers ___ correct.',a:['are','were','is','be'],c:2,e:'In formal standard English, “neither” is treated as singular here.'},
{q:'Choose the correct article: ___ honest person.',a:['A','An','The only possible is A','No article'],c:1,e:'“Honest” begins with a vowel sound, so use “an.”'}
];
function renderGrammar(){
 $('#gameIntro').innerHTML='<h2>Grammar Rush <span style="color:#7ff1c3">/ Brain Boost</span></h2><p>Answer English questions on grammar, tenses, vocabulary, and punctuation. Get instant explanations and earn XP for every correct answer.</p>';
 $('#gameArea').innerHTML='<div class="quiz-box" id="quizBox"></div>';let order=[],index=0,score=0,answered=false;
 function begin(){order=questions.map((_,i)=>i).sort(()=>Math.random()-.5).slice(0,10);index=0;score=0;show();}
 function show(){answered=false;let q=questions[order[index]],pct=index/10*100;$('#quizBox').innerHTML=`<div class="quiz-progress"><i style="width:${pct}%"></i></div><div class="quiz-meta"><span>QUESTION ${index+1} OF 10</span><span>🏆 SCORE: ${score}</span></div><h3 class="quiz-question">${q.q}</h3><div class="quiz-options">${q.a.map((a,i)=>`<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65+i)}. &nbsp; ${a}</button>`).join('')}</div><div id="quizFeedback" class="quiz-feedback"></div><div class="game-actions"><button class="game-btn quiz-next hidden" id="quizNext">${index===9?'See results':'Next question →'}</button></div>`;$$('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));$('#gameStatus').textContent='QUESTION '+(index+1)+'/10';}
 function answer(n){if(answered)return;answered=true;let q=questions[order[index]],buttons=$$('[data-answer]');buttons.forEach((b,i)=>{b.disabled=true;if(i===q.c)b.classList.add('correct');if(i===n&&n!==q.c)b.classList.add('wrong');});if(n===q.c){score++;addRewards(10,2);$('#quizFeedback').textContent='✓ Correct! '+q.e;}else{$('#quizFeedback').textContent='Not quite. '+q.e;}$('#quizNext').classList.remove('hidden');}
 function next(){index++;if(index>=10){$('#gameStatus').textContent='QUIZ COMPLETE';$('#quizBox').innerHTML=`<div class="end-card"><div class="big-emoji">${score>=8?'🏆':score>=5?'🌟':'📚'}</div><h2>${score>=8?'Grammar champion!':score>=5?'Nice work!':'Keep practising!'}</h2><p>You scored <b>${score}/10</b>. ${score>=8?'Excellent grammar skills!':'Every round helps your English improve.'}</p><p>Earned ${score*10} XP from correct answers, plus practice rewards.</p><button class="game-btn" id="quizAgain">▶ Play another round</button></div>`;$('#quizAgain').onclick=begin;addRewards(score*2,score);return;}show();}
 $('#quizBox').addEventListener('click',e=>{if(e.target&&e.target.id==='quizNext')next();});begin();cleanupGame=()=>{};
}



// Extra offline mini-games: Tetris, Sudoku, Flappy Flyer, and Math Sprint.
function renderTetris(){
 $('#gameIntro').innerHTML='<h2>Tetris <span style="color:#55e6e9">/ Block Drop</span></h2><p>Arrow keys move, Up rotates, and Space drops the piece. Clear lines to score.</p>';
 $('#gameArea').innerHTML='<div class="mini-game-layout"><div><canvas id="tetrisCanvas" width="300" height="600" class="mini-canvas"></canvas><div class="game-actions"><button class="game-btn" id="tetrisStart">▶ Start / Restart</button></div></div><div class="side-panel"><div class="mini-stat"><small>SCORE</small><b id="tetrisScore">0</b></div><div class="mini-stat"><small>LINES</small><b id="tetrisLines">0</b></div><div class="mode-description">← → move · ↑ rotate · ↓ soft drop · Space hard drop</div></div></div>';
 const c=$('#tetrisCanvas'),ctx=c.getContext('2d'),sz=30,W=10,H=20;
 const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
 const colors=['#51e5e8','#ffe078','#a78bfa','#ff9f6e','#68a8ff','#79f3b5','#ff7da8'];
 let board,shape,x,y,score,lines,timer,live=false;
 function piece(){const i=Math.floor(Math.random()*shapes.length);return {m:shapes[i].map(r=>r.slice()),color:colors[i]};}
 function reset(){clearInterval(timer);board=Array.from({length:H},()=>Array(W).fill(null));score=lines=0;live=true;spawn();paint();timer=setInterval(drop,500);}
 function spawn(){const p=piece();shape=p.m;shapeColor=p.color;x=3;y=0;if(collide(x,y,shape)){live=false;clearInterval(timer);}}
 let shapeColor='#fff';
 function collide(nx,ny,m){return m.some((row,dy)=>row.some((v,dx)=>v&&(nx+dx<0||nx+dx>=W||ny+dy>=H||(ny+dy>=0&&board[ny+dy][nx+dx]))));}
 function lock(){shape.forEach((r,dy)=>r.forEach((v,dx)=>{if(v&&y+dy>=0)board[y+dy][x+dx]=shapeColor;}));let kept=board.filter(r=>r.some(v=>!v));let n=H-kept.length;while(kept.length<H)kept.unshift(Array(W).fill(null));board=kept;lines+=n;score+=([0,100,300,500,800][n]||0);$('#tetrisScore').textContent=score;$('#tetrisLines').textContent=lines;spawn();}
 function drop(){if(!live)return;if(!collide(x,y+1,shape))y++;else lock();paint();}
 function rotate(m){return m[0].map((_,i)=>m.map(r=>r[i]).reverse());}
 function paint(){ctx.fillStyle='#091226';ctx.fillRect(0,0,c.width,c.height);for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const v=board[yy][xx];if(v){ctx.fillStyle=v;ctx.fillRect(xx*sz+1,yy*sz+1,sz-2,sz-2);}}if(shape)shape.forEach((r,dy)=>r.forEach((v,dx)=>{if(v){ctx.fillStyle=shapeColor;ctx.fillRect((x+dx)*sz+1,(y+dy)*sz+1,sz-2,sz-2);}}));ctx.strokeStyle='#263657';for(let i=0;i<=W;i++){ctx.beginPath();ctx.moveTo(i*sz,0);ctx.lineTo(i*sz,c.height);ctx.stroke();}for(let i=0;i<=H;i++){ctx.beginPath();ctx.moveTo(0,i*sz);ctx.lineTo(c.width,i*sz);ctx.stroke();}}
 function key(e){if(!live)return;if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'&&!collide(x-1,y,shape))x--;if(e.key==='ArrowRight'&&!collide(x+1,y,shape))x++;if(e.key==='ArrowDown')drop();if(e.key==='ArrowUp'){const m=rotate(shape);if(!collide(x,y,m))shape=m;}if(e.key===' '){while(!collide(x,y+1,shape))y++;lock();}paint();}
 window.addEventListener('keydown',key);$('#tetrisStart').onclick=reset;reset();cleanupGame=()=>{clearInterval(timer);window.removeEventListener('keydown',key);};
}
function renderSudoku(){
 $('#gameIntro').innerHTML='<h2>Sudoku <span style="color:#55e6e9">/ Logic Lab</span></h2><p>Fill every row, column, and 3×3 box with digits 1–9. Select a cell, then type a number.</p>';
 $('#gameArea').innerHTML='<div class="sudoku-wrap"><div id="sudokuBoard" class="sudoku-board"></div><div class="game-actions"><button class="game-btn" id="sudokuNew">New puzzle</button><button class="game-btn alt" id="sudokuCheck">Check answers</button></div><p id="sudokuMessage" class="game-instructions">Choose an empty cell and type 1–9.</p></div>';
 const puzzles=[
 '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
 '009000000080605020700040003020010090000907000010080070900020008030806040000000600'
 ];
 let solution,puzzle,selected=0;
 function solve(g){for(let i=0;i<81;i++)if(!g[i]){let r=Math.floor(i/9),c=i%9;for(let n=1;n<=9;n++){if(valid(g,i,n)){g[i]=n;if(solve(g))return true;g[i]=0;}}return false;}return true;}
 function valid(g,i,n){let r=Math.floor(i/9),c=i%9;for(let j=0;j<9;j++)if(g[r*9+j]===n||g[j*9+c]===n)return false;let br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let y=br;y<br+3;y++)for(let x=bc;x<bc+3;x++)if(g[y*9+x]===n)return false;return true;}
 function fresh(){puzzle=puzzles[Math.floor(Math.random()*puzzles.length)].split('').map(Number);solution=puzzle.slice();solve(solution);selected=0;draw();}
 function draw(){const b=$('#sudokuBoard');b.innerHTML='';puzzle.forEach((n,i)=>{const el=document.createElement('button');el.className='sudoku-cell'+(n?' given':'')+(i===selected?' selected':'');el.textContent=n||'';el.onclick=()=>{selected=i;draw();};b.appendChild(el);});}
 function key(e){if(currentGame!=='sudoku')return;if(/^[1-9]$/.test(e.key)&&!puzzles.some(()=>false)){if(!puzzle[selected]||puzzle[selected]===solution[selected]){puzzle[selected]=Number(e.key);draw();}e.preventDefault();}if(e.key==='Backspace'||e.key==='Delete'){if(!puzzle[selected])return;puzzle[selected]=0;draw();}}
 window.addEventListener('keydown',key);
 $('#sudokuNew').onclick=fresh;$('#sudokuCheck').onclick=()=>{let wrong=puzzle.some((n,i)=>n!==0&&n!==solution[i]);let empty=puzzle.some(n=>!n);$('#sudokuMessage').textContent=wrong?'Some numbers need another look. Keep going!':empty?'Great so far — fill the remaining cells.':'🎉 Sudoku solved! +50 XP';if(!wrong&&!empty)addRewards(50,8);};
 fresh();cleanupGame=()=>window.removeEventListener('keydown',key);
}
function renderFlappy(){
 $('#gameIntro').innerHTML='<h2>Flappy Flyer <span style="color:#55e6e9">/ Reflex Run</span></h2><p>Click the game or press Space to flap. Pass through the gaps between the pipes.</p>';
 $('#gameArea').innerHTML='<div class="flappy-wrap"><canvas id="flappyCanvas" width="640" height="400" class="mini-canvas flappy-canvas"></canvas><div class="game-actions"><button class="game-btn" id="flappyStart">▶ Start / Restart</button></div><p id="flappyMessage" class="game-instructions">Press Space or click to flap.</p></div>';
 const c=$('#flappyCanvas'),ctx=c.getContext('2d');let birdY=180,vy=0,pipes=[],score=0,live=false,raf=0,last=0;
 function reset(){cancelAnimationFrame(raf);birdY=180;vy=0;pipes=[];score=0;live=true;last=0;$('#flappyMessage').textContent='Fly through the gaps!';pipes.push({x:680,gap:150,passed:false});loop(0);}
 function flap(){if(!live){reset();return;}vy=-5.8;}
 function key(e){if(e.code==='Space'&&currentGame==='flappy'){e.preventDefault();flap();}}
 window.addEventListener('keydown',key);c.addEventListener('pointerdown',flap);$('#flappyStart').onclick=reset;
 function loop(ts){if(!live)return;let dt=Math.min(2,(ts-last)/16||1);last=ts;vy+=.28*dt;birdY+=vy*dt;if(pipes.length===0||pipes[pipes.length-1].x<390)pipes.push({x:680,gap:105+Math.random()*180,passed:false});pipes.forEach(p=>p.x-=2.6*dt);pipes=pipes.filter(p=>p.x>-70);for(const p of pipes){if(!p.passed&&p.x+55<90){p.passed=true;score++;$('#flappyMessage').textContent='Score: '+score;if(score%5===0)addRewards(10,2);}if(90+18>p.x&&90-18<p.x+55&&(birdY-12<p.gap-65||birdY+12>p.gap+65)){live=false;$('#flappyMessage').textContent='Game over — score '+score+'. Press Start to try again.';}}
 if(birdY<0||birdY>c.height) {live=false;$('#flappyMessage').textContent='Game over — score '+score+'. Press Start to try again.';}
 ctx.fillStyle='#101d3a';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#172c4b';for(let i=0;i<8;i++)ctx.fillRect((i*100-(ts*.03)%100),50+(i%3)*60,35,4);
 pipes.forEach(p=>{ctx.fillStyle='#55e5a6';ctx.fillRect(p.x,0,55,p.gap-65);ctx.fillRect(p.x,p.gap+65,55,c.height-p.gap-65);ctx.fillStyle='#a0ffd5';ctx.fillRect(p.x-4,p.gap-75,63,10);ctx.fillRect(p.x-4,p.gap+65,63,10);});ctx.font='28px sans-serif';ctx.fillText('🐤',72,birdY+10);ctx.fillStyle='#fff';ctx.font='bold 24px sans-serif';ctx.fillText(score,20,35);if(live)raf=requestAnimationFrame(loop);}
 reset();cleanupGame=()=>{live=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',key);c.removeEventListener('pointerdown',flap);};
}
function renderMathSprint(){
 $('#gameIntro').innerHTML='<h2>Math Sprint <span style="color:#55e6e9">/ Number Dash</span></h2><p>Solve as many arithmetic questions as you can in 60 seconds. Questions are generated locally, so it works offline.</p>';
 $('#gameArea').innerHTML='<div class="quiz-box math-box"><div class="quiz-meta"><span>TIME LEFT</span><b id="mathTime">60</b><span>SCORE <b id="mathScore">0</b></span></div><h3 id="mathQuestion" class="quiz-question">Ready?</h3><form id="mathForm" class="math-form"><input id="mathAnswer" type="number" placeholder="Your answer" autocomplete="off"><button class="game-btn">Submit</button></form><div id="mathFeedback" class="quiz-feedback"></div><div class="game-actions"><button class="game-btn alt" id="mathStart">▶ Start sprint</button></div></div>';
 let time=60,score=0,timer=null,answer=0,live=false;
 function question(){const ops=['+','−','×'];const op=ops[Math.floor(Math.random()*ops.length)];let a=1+Math.floor(Math.random()*20),b=1+Math.floor(Math.random()*12);if(op==='−'&&b>a)[a,b]=[b,a];answer=op==='+'?a+b:op==='−'?a-b:a*b;$('#mathQuestion').textContent=`${a} ${op} ${b} = ?`;$('#mathAnswer').value='';$('#mathAnswer').focus();}
 function finish(){live=false;clearInterval(timer);$('#mathFeedback').textContent=`Time! You scored ${score}. ${score>=20?'Fantastic speed!':'Keep practising to build fluency.'}`;addRewards(score*2,Math.floor(score/3));}
 function start(){clearInterval(timer);time=60;score=0;live=true;$('#mathTime').textContent=time;$('#mathScore').textContent=score;$('#mathFeedback').textContent='Go!';question();timer=setInterval(()=>{time--;$('#mathTime').textContent=time;if(time<=0)finish();},1000);}
 $('#mathForm').onsubmit=e=>{e.preventDefault();if(!live)return;if(Number($('#mathAnswer').value)===answer){score++;$('#mathScore').textContent=score;$('#mathFeedback').textContent='Correct!';question();}else $('#mathFeedback').textContent='Try again — you have time!';};
 $('#mathStart').onclick=start;start();cleanupGame=()=>clearInterval(timer);
}

// Settings: local preferences, synthetic background music, sound feedback, FPS and network estimate.
const settingsDefaults={music:true,sfx:true,musicVolume:25,sfxVolume:35,overlay:true,reduceMotion:false,tips:true};
let settings={...settingsDefaults};
try{settings={...settingsDefaults,...JSON.parse(localStorage.getItem('aplusSettings')||'{}')}}catch(e){}
let audioCtx=null,musicTimer=null,musicStep=0,musicGain=null,lastFpsStamp=performance.now(),fpsFrames=0,fps=0,networkInterval=null;
function saveSettings(){try{localStorage.setItem('aplusSettings',JSON.stringify(settings))}catch(e){}}
function syncSettingsUI(){
 const pairs=[['musicToggle','music'],['sfxToggle','sfx'],['overlayToggle','overlay'],['reduceMotionToggle','reduceMotion'],['tipsToggle','tips']];
 pairs.forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=!!settings[key]});
 [['musicVolume','musicVolume','musicVolumeLabel'],['sfxVolume','sfxVolume','sfxVolumeLabel']].forEach(([id,key,label])=>{const el=document.getElementById(id),out=document.getElementById(label);if(el)el.value=settings[key];if(out)out.textContent=settings[key]+'%'});
 document.body.classList.toggle('reduce-motion',!!settings.reduceMotion);
}
function ensureAudio(){if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;audioCtx=new AC();musicGain=audioCtx.createGain();musicGain.gain.value=(settings.musicVolume/100)*0.12;musicGain.connect(audioCtx.destination);}if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}
function tone(freq,duration=0.12,type='sine',volume=.08){const ac=ensureAudio();if(!ac||!settings.sfx)return;const osc=ac.createOscillator(),gain=ac.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.value=(settings.sfxVolume/100)*volume;osc.connect(gain);gain.connect(ac.destination);osc.start();gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+duration);osc.stop(ac.currentTime+duration);}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
function startMusic(){
 stopMusic();const ac=ensureAudio();if(!ac||!settings.music)return;musicStep=0;
 // Original, procedurally generated arcade loop: no audio downloads or internet required.
 const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,987.77,880,783.99,698.46,659.25,587.33];
 const bass=[130.81,130.81,164.81,164.81,174.61,174.61,146.83,146.83];
 const play=(freq,dur,when,vol,wave='triangle')=>{const o=ac.createOscillator(),g=ac.createGain();o.type=wave;o.frequency.setValueAtTime(freq,when);g.gain.setValueAtTime(0.0001,when);g.gain.linearRampToValueAtTime((settings.musicVolume/100)*vol,when+.025);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g);g.connect(musicGain);o.start(when);o.stop(when+dur+.02);};
 musicTimer=setInterval(()=>{if(!settings.music||!musicGain||ac.state!=='running')return;const step=musicStep++%melody.length,now=ac.currentTime;play(melody[step],.22,now,.16,'triangle');if(step%2===0)play(bass[(step/2)%bass.length],.36,now,.13,'sine');if(step%4===0){play(melody[step]/2,.42,now,.035,'sine');}},230);
}
// Start audio after the first real user gesture (desktop browser autoplay policy).
const unlockArcadeAudio=()=>{if(settings.music){ensureAudio();if(!musicTimer)startMusic();}window.removeEventListener('pointerdown',unlockArcadeAudio);window.removeEventListener('keydown',unlockArcadeAudio);};
window.addEventListener('pointerdown',unlockArcadeAudio);window.addEventListener('keydown',unlockArcadeAudio);
function applyAudio(){if(settings.music)startMusic();else stopMusic();if(musicGain)musicGain.gain.value=(settings.musicVolume/100)*.12;}
function tickFps(now){fpsFrames++;if(now-lastFpsStamp>=1000){fps=Math.round(fpsFrames*1000/(now-lastFpsStamp));fpsFrames=0;lastFpsStamp=now;const el=document.getElementById('fpsValue');if(el)el.textContent=fps;const top=document.getElementById('fpsTopValue');if(top)top.textContent=fps;}requestAnimationFrame(tickFps);}
requestAnimationFrame(tickFps);
async function refreshNetwork(){
 const pingEl=document.getElementById('pingValue'),pingLabel=document.getElementById('pingLabel'),scoreEl=document.getElementById('internetScore'),scoreBar=document.getElementById('internetScoreBar'),scoreLabel=document.getElementById('internetLabel'),stateEl=document.getElementById('connectionState'),timeEl=document.getElementById('networkCheckedAt');
 if(!pingEl)return;
 pingEl.textContent='…';pingLabel.textContent='testing connection';scoreEl.textContent='…';scoreLabel.textContent='testing connection';
 const start=performance.now();
 try{
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4500);
   await fetch('https://www.gstatic.com/generate_204?cacheBust='+Date.now(),{mode:'no-cors',cache:'no-store',signal:controller.signal});
   clearTimeout(timeout);
   const ms=Math.max(1,Math.round(performance.now()-start));
   pingEl.textContent=ms+' ms';pingLabel.textContent=ms<60?'Very responsive':ms<150?'Good response':'Slow response';
   // A simple, clearly-labelled 0–10 responsiveness estimate, not a bandwidth test.
   const rating=Math.max(0,Math.min(10,Math.round(10-ms/45)));
   scoreEl.textContent=rating;scoreBar.style.width=(rating*10)+'%';scoreLabel.textContent=rating>=8?'Excellent response':rating>=5?'Fair response':'Slow response';
   stateEl.textContent='Online (check succeeded)';stateEl.style.color='#80f4d2';
 }catch(e){
   pingEl.textContent='N/A';pingLabel.textContent='unavailable / blocked';scoreEl.textContent='—';scoreBar.style.width='0%';scoreLabel.textContent='no reliable connection result';stateEl.textContent=navigator.onLine?'Check blocked or timed out':'Offline';stateEl.style.color='#ffad9e';
 }
 timeEl.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function bindSetting(id,key,transform=v=>v){const el=document.getElementById(id);if(!el)return;el.addEventListener('change',()=>{settings[key]=transform(el.type==='checkbox'?el.checked:Number(el.value));saveSettings();syncSettingsUI();if(key==='music'||key==='musicVolume')applyAudio();if(key==='sfx')tone(660,.08);});}
bindSetting('musicToggle','music');bindSetting('sfxToggle','sfx');bindSetting('overlayToggle','overlay');bindSetting('reduceMotionToggle','reduceMotion');bindSetting('tipsToggle','tips');bindSetting('musicVolume','musicVolume',v=>Math.max(0,Math.min(100,v)));bindSetting('sfxVolume','sfxVolume',v=>Math.max(0,Math.min(100,v)));
$('#refreshNetwork')?.addEventListener('click',refreshNetwork);
$('#settingsShortcut')?.addEventListener('click',()=>showPage('settings'));
$('#resetSettings')?.addEventListener('click',()=>{settings={...settingsDefaults};saveSettings();syncSettingsUI();applyAudio();tone(520,.08);});
syncSettingsUI();
window.addEventListener('online',()=>{if(currentGame==='settings')refreshNetwork()});
window.addEventListener('offline',()=>{if(currentGame==='settings')refreshNetwork()});
