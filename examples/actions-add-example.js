import { CommandParser } from "../decision-maker.js"
import { ClickAction } from "../actions/click.js"
import { ScrollAction } from "../actions/scroll.js"
import { FormVoiceAction } from "../actions/forms.js"
import { SearchAction } from "../actions/search.js"
import { DownloadMediaAction } from "../actions/media.js"


export const parser = new CommandParser();


window.addEventListener('load', async () => {
  parser.registerAction(new ScrollAction());
  parser.registerAction(new ClickAction());
  parser.registerAction(new FormVoiceAction());
  parser.registerAction(new SearchAction());
  parser.registerAction(new DownloadMediaAction());
})
