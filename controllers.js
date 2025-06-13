import { parser } from './phrase.js'


let mediaRecorder;
let recordedChunks = [];
let mediaStream;
let recognition;
let recognitionStarted
let finalTranscript

const speechRecognition =	window.SpeechRecognition || window.webkitSpeechRecognition



export function getAudio() {
	document.getElementById('startButton').addEventListener('click', async () => {
    try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream);

    mediaRecorder.ondataavailable = ({data}) => {
        recordedChunks.push(data);
        console.log(data)
    };

    mediaRecorder.onstop = () => {
        let timestamp = new Date()
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${timestamp.toISOString()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    document.getElementById('stopButton').disabled = false;
    document.getElementById('startButton').disabled = true;
    } catch (error) {
    console.error('Error accessing microphone:', error);
    }
	});

	document.getElementById('stopButton').addEventListener('click', () => {
    if (mediaRecorder) {
    mediaRecorder.stop();
    }
    if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
	});
}


export async function startSpeechRecognition() {
	const DICTIONARY = {
		точка: '.',
		запятая: ',',
		вопрос: '?',
		восклицание: '!',
		двоеточие: ':',
		тире: '-',
		абзац: '\n',
		отступ: '\t'
	}

	const editInterim = (s) => s
    .split(' ')
    .map((word) => {
      word = word.trim()
      return DICTIONARY[word.toLowerCase()]
        ? DICTIONARY[word.toLowerCase()]
        : word
    })
    .join(' ')

	const editFinal = (s) => s.replace(/\s{1,}([\.+,?!:-])/g, '$1')

	resetRecognition()

  recognition = new speechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 3
  recognition.lang = 'ru-RU'
  console.log('@recognition', recognition)

  recognition.start()
  recognitionStarted = true

  recognition.onend = () => {
    if (!recognitionStarted) return
    recognition.start()
  }

  recognition.onresult = async (e) => {
    let interimTranscript = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        const interimResult = editInterim(e.results[i][0].transcript)
        finalTranscript += interimResult
		const action = parser.parse(interimResult);
		console.log(action.action.name);
		action.action?.execute(action.params);
      } else {
        interimTranscript += e.results[i][0].transcript
      }
    }
		console.log(interimTranscript)
    interimTranscriptBox.value = interimTranscript
    finalTranscript = editFinal(finalTranscript)
    finalTranscriptBox.value = finalTranscript
  }
}

function resetRecognition() {
	recognition = null
	recognitionStarted = false
	finalTranscript = ''
	interimTranscriptBox.value = ''
	finalTranscriptBox.value = ''
}

export function stopRecognition() {
	console.log('@recognition stoped');
  if (!recognition) return
  recognition.stop()
  recognitionStarted = false
}

export function abortRecognition() {
	console.log('@recognition aborted');
  if (!recognition) return
  recognition.abort()
  resetRecognition()
}
