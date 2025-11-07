// Auto-load scripts from /data/scripts folder
import habitacionalScript from "@/data/scripts/habitacional-script.json"
import hab532Script from "@/data/scripts/hab532-script.json"
import comercialScript from "@/data/scripts/comercial-script.json"

export const AUTO_LOAD_SCRIPTS = [habitacionalScript, hab532Script, comercialScript]

export function getAutoLoadScripts() {
  return AUTO_LOAD_SCRIPTS
}
