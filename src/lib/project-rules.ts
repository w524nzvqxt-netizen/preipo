import rules from "../../bot/project-rules.json";

export const projectRulesVersion = rules.version;
export const projectRulesPrompt = "\n\n" + rules.system;
export function projectRulesStatus() {
  return `Версия правил: ${rules.version}\n\n${rules.summary}`;
}
