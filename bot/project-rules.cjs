const fs=require('node:fs'),path=require('node:path');
function readProjectRules(repoRoot){
 const file=repoRoot?path.join(repoRoot,'bot/project-rules.json'):path.join(__dirname,'project-rules.json');
 const rules=JSON.parse(fs.readFileSync(file,'utf8'));
 if(typeof rules.version!=='string'||typeof rules.system!=='string'||!rules.system.trim()||typeof rules.summary!=='string')throw Error('Invalid project rules bundle');
 return rules;
}
module.exports={readProjectRules};
