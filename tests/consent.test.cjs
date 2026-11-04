const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../consent.js', 'utf8');
function setup({marketing = false, method = 'explicit', response = true, cmp = true, enabled = true} = {}) {
  const events = {}, docEvents = {}, scripts = [], commands = [], cookies = [];
  let reloads = 0;
  let consentCookie = 'CookieConsent=initial';
  class Element {
    constructor(kind) { this.kind = kind; this.dataset = {cookieAction:kind}; }
    closest(selector) {
      return selector === '[data-cookie-action]' ? (['renew','withdraw'].includes(this.kind) ? this : null) : this.kind === 'cta' ? this : null;
    }
  }
  const feedback = {textContent:''};
  const document = {
    documentElement:{dataset:{metaPixel:enabled ? 'enabled' : ''}},
    head:{append(tag) { scripts.push(tag); }},
    createElement() { return {setAttribute(){},remove(){this.removed = true;}}; },
    addEventListener(name,fn) { docEvents[name] = fn; },
    querySelector() { return feedback; },
    get cookie() { return consentCookie; },
    set cookie(value) { cookies.push(value); }
  };
  const window = {addEventListener(name,fn) { events[name] = fn; }};
  if (cmp) window.Cookiebot = {hasResponse:response,consent:{marketing,method},renew(){this.renewed=true;},withdraw(){this.consent.marketing=false;this.hasResponse=false;}};
  vm.runInNewContext(source,{window,document,Element,location:{hostname:'katismie.github.io',pathname:'/SafeClick.de/index.html',reload(){reloads++;}}});
  return {
    window,scripts,commands,cookies,feedback,
    get reloads(){return reloads;},
    changeCookie() { consentCookie = 'CookieConsent=changed-in-another-tab'; },
    consent(marketing, response=true, method='explicit') { window.Cookiebot.hasResponse=response;window.Cookiebot.consent={marketing,method}; events.CookiebotOnConsentReady(); },
    emit(name) { events[name](); },
    load() { const q=window.fbq; commands.push(...q.queue.map(args=>Array.from(args)));q.queue=[];q.callMethod=function(...args){commands.push(args);};scripts.at(-1).onload?.(); },
    click(kind='cta') { docEvents.click({target:new Element(kind),preventDefault(){}}); }
  };
}
const tracked = h => h.commands.filter(c=>c[0].startsWith('track'));
let h=setup({cmp:false});h.click();assert.equal(h.scripts.length,0);h.click('renew');assert.match(h.feedback.textContent,/nicht verfügbar/);
h=setup({response:false});h.click();assert.equal(h.scripts.length,0);
h=setup();h.click();h.emit('CookiebotOnAccept');assert.equal(h.scripts.length,0);
h=setup({marketing:true,method:'implied'});assert.equal(h.scripts.length,0);
h=setup({marketing:true,response:false});assert.equal(h.scripts.length,0);
h=setup();h.click();h.consent(true);h.click();assert.equal(h.scripts.length,1);assert.equal(tracked(h).length,0);h.load();assert.deepEqual(tracked(h),[['trackSingle','1686772673495132','PageView']]);h.emit('CookiebotOnAccept');h.emit('CookiebotOnConsentReady');assert.equal(h.scripts.length,1);assert.equal(tracked(h).length,1);h.click();h.click();assert.equal(tracked(h).filter(c=>c[2]==='MehrErfahrenClick').length,2);
h.consent(false);const count=tracked(h).length;h.click();assert.equal(tracked(h).length,count);assert.equal(h.reloads,1);assert.ok(h.commands.some(c=>c[0]==='consent'&&c[1]==='revoke'));assert.ok(h.cookies.some(c=>c.startsWith('_fbp=;')));assert.ok(h.cookies.some(c=>c.startsWith('_fbc=;')));
h=setup({marketing:true});h.consent(false,false);assert.equal(h.reloads,1);h.load();assert.equal(tracked(h).length,0);
h=setup({marketing:true});h.load();h.click('withdraw');assert.equal(h.reloads,1);assert.equal(h.window.Cookiebot.consent.marketing,false);
h=setup({marketing:true});h.load();h.window.Cookiebot.consent.marketing=false;h.click();assert.equal(tracked(h).length,1);assert.equal(h.reloads,1);
h=setup({marketing:true});h.load();h.changeCookie();h.click();assert.equal(tracked(h).length,1);assert.equal(h.reloads,1);
h=setup({marketing:true});h.changeCookie();h.load();assert.equal(tracked(h).length,0);assert.equal(h.reloads,1);
h=setup({marketing:true,enabled:false});h.click();assert.equal(h.scripts.length,0);h.click('renew');assert.equal(h.window.Cookiebot.renewed,true);h.click('withdraw');assert.equal(h.window.Cookiebot.consent.marketing,false);assert.equal(h.reloads,0);
h=setup({marketing:true});h.scripts[0].onerror();h.click();assert.equal(tracked(h).length,0);
for (const name of ['index.html','impressum.html','datenschutz.html']) {
  const html=fs.readFileSync(__dirname+'/../'+name,'utf8');
  const tags=[...html.matchAll(/<script\b[^>]*>/g)].map(m=>m[0]);
  assert.match(tags[0],/id="Cookiebot"/);assert.match(tags[0],/data-culture="DE"/);assert.match(tags[0],/data-level="strict"/);
  assert.match(html,/data-cookie-action="renew"/);assert.match(html,/data-cookie-action="withdraw"/);
  assert.doesNotMatch(html,/<img[^>]+facebook\.com\/tr/);
  if(name!=='index.html')assert.doesNotMatch(html,/data-meta-pixel="enabled"/);
}
assert.equal((fs.readFileSync(__dirname+'/../index.html','utf8').match(/data-meta-event="mehr-erfahren"/g)||[]).length,1);
console.log('PASS: consent absent/pending/refused/implied, opt-in, saved consent, no replay, deduplication, click counting, withdrawal/load race, stale consent, CMP failure, SDK failure, legal pages and HTML integration.');
