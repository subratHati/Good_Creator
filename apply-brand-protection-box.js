// apply-brand-protection-box.js
// Run from the collabspace folder:  node apply-brand-protection-box.js
// Adds a green "Your payment is protected" box above the Pay button on the
// brand's payment request card. Needs apply-refund-rules.js applied first.
// All-or-nothing.
const fs = require('fs');
const path = require('path');

const PLAN = {
 "creates": [],
 "edits": [
  {
   "file": "client/src/pages/messages/ChatWindow.jsx",
   "edits": [
    {
     "find": "            Secure payment protected by Good Creator\n          </p>\n        </div>\n\n        <button\n          type=\"button\"\n          onClick={() => setShowRules(true)}\n          className=\"mt-3 w-full text-center text-xs font-semibold text-[#155DFC] underline underline-offset-2 cursor-pointer\"\n        >",
     "replace": "            Secure payment protected by Good Creator\n          </p>\n        </div>\n\n        {/* reassurance for the brand, before they pay */}\n        {status === \"pending\" && !isOwn && !expired && (\n          <div className=\"mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3\">\n            <p className=\"text-xs font-bold text-green-800 mb-2\">Your payment is protected</p>\n            <ul className=\"space-y-1.5\">\n              {[\n                \"Your money is held by GoodCreator until you approve the delivery\",\n                \"If the creator misses the deadline, your money is returned to you\",\n                \"You get 48 hours to review the delivery\",\n              ].map((line) => (\n                <li key={line} className=\"flex items-start gap-2 text-xs leading-snug text-green-800\">\n                  <CheckCircle2 className=\"w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600\" />\n                  <span>{line}</span>\n                </li>\n              ))}\n            </ul>\n          </div>\n        )}\n\n        <button\n          type=\"button\"\n          onClick={() => setShowRules(true)}\n          className=\"mt-3 w-full text-center text-xs font-semibold text-[#155DFC] underline underline-offset-2 cursor-pointer\"\n        >"
    }
   ]
  }
 ]
};

const root = process.cwd();
let failed = false;
const writes = [];

for (const c of PLAN.creates) {
  const full = path.join(root, c.file);
  if (fs.existsSync(full)) { console.log('ALREADY EXISTS  ' + c.file + '  (not overwritten)'); failed = true; continue; }
  writes.push({ full, text: c.content, create: true, label: 'created  ' + c.file });
}

for (const item of PLAN.edits) {
  const full = path.join(root, item.file);
  if (!fs.existsSync(full)) { console.log('MISSING FILE    ' + item.file + '  (run this from the collabspace folder)'); failed = true; continue; }
  let text = fs.readFileSync(full, 'utf8');
  const crlf = text.includes('\r\n');
  const fit = (s) => (crlf ? s.replace(/\r?\n/g, '\r\n') : s);
  item.edits.forEach((e, i) => {
    const find = fit(e.find);
    const count = text.split(find).length - 1;
    if (count !== 1) {
      console.log('NOT APPLIED     ' + item.file + '  edit ' + (i + 1) + ' (found ' + count + ' times, needed 1)');
      console.log('                starts with: ' + e.find.split('\n')[0].trim().slice(0, 80));
      failed = true;
    } else {
      text = text.replace(find, () => fit(e.replace));
    }
  });
  writes.push({ full, text, label: 'updated  ' + item.file + '  (' + item.edits.length + ' change' + (item.edits.length > 1 ? 's' : '') + ')' });
}

if (failed) {
  console.log('\nNothing was changed. Send me the lines above and I will fix the patch.');
  process.exit(1);
}
for (const w of writes) { if (w.create) fs.mkdirSync(path.dirname(w.full), { recursive: true }); fs.writeFileSync(w.full, w.text); console.log(w.label); }
console.log('\nDone. Now restart the client (npm run dev) and look at a payment request as the brand.');
