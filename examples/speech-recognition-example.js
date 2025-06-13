import { startSpeechRecognition, stopRecognition, abortRecognition } from "../controllers.js"


window.addEventListener('load', async () => {
  startSpeechRecognitionBtn.onclick = async () => {
    await startSpeechRecognition()
  }
  stopRecognitionBtn.onclick = () => {
    stopRecognition()
  }
  abortRecognitionBtn.onclick = () => {
    abortRecognition()
  }
})
