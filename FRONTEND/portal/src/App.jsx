import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, Send, Volume2, Search, AlertCircle, Activity } from 'lucide-react';

function MedicalReportAgent() {
  const [lang, setLang] = useState('en');
  const [currentFile, setCurrentFile] = useState(null);
  const [reportSummary, setReportSummary] = useState('');
  const [structuredReport, setStructuredReport] = useState(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [isVoiceConversationActive, setIsVoiceConversationActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatAreaRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // Change this if one free model stops working.
  // Pick a current free multimodal/vision model from OpenRouter free models.
  const OPENROUTER_MODEL = 'openrouter/auto';

  const translations = {
    en: {
      title: 'Medical Report Agent',
      subtitle: 'Upload your report · Get AI analysis · Ask questions by voice or text',
      uploadLabel: 'Drop your medical report here',
      uploadSub: 'Blood reports · MRI · X-ray · Pregnancy scans · ECG · Any medical document',
      analyzeBtn: 'Analyze Report',
      analyzing: 'Analyzing…',
      welcome: '✓ Report analyzed! Ask me anything about your report.',
      micStart: 'Listening… speak now',
      placeholder: 'Type your question…',
      readAloud: 'Read aloud',
      summaryTitle: 'Report Summary',
      chatTitle: 'Ask the Agent',
      fileRequired: 'Please select a file first',
      apiRequired: 'Please enter your OpenRouter API key first',
      thinking: 'Thinking…',
      genericDoctorNote:
        'This is AI-generated information and not a medical diagnosis. Please consult a qualified doctor for treatment decisions.'
    },
    kn: {
      title: 'Medical Report Agent',
      subtitle: 'ನಿಮ್ಮ ವರದಿ ಅಪ್ಲೋಡ್ ಮಾಡಿ · AI ವಿಶ್ಲೇಷಣೆ · ಧ್ವನಿ ಅಥವಾ ಪಠ್ಯದಲ್ಲಿ ಕೇಳಿ',
      uploadLabel: 'ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ವರದಿಯನ್ನು ಇಲ್ಲಿ ಹಾಕಿ',
      uploadSub: 'ರಕ್ತ ಪರೀಕ್ಷೆ · MRI · X-ray · ಗರ್ಭಾವಸ್ಥೆ ಸ್ಕ್ಯಾನ್ · ECG · ಎಲ್ಲಾ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು',
      analyzeBtn: 'ವರದಿ ವಿಶ್ಲೇಷಿಸಿ',
      analyzing: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…',
      welcome: '✓ ವರದಿ ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ವರದಿಯ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.',
      micStart: 'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಮಾತನಾಡಿ',
      placeholder: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ…',
      readAloud: 'ಓದಿ ಹೇಳಿ',
      summaryTitle: 'ವರದಿ ಸಾರಾಂಶ',
      chatTitle: 'ಏಜೆಂಟ್‌ಗೆ ಕೇಳಿ',
      fileRequired: 'ದಯವಿಟ್ಟು ಮೊದಲು ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ',
      apiRequired: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ OpenRouter API key ನಮೂದಿಸಿ',
      thinking: 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…',
      genericDoctorNote:
        'ಇದು AI ಸೃಷ್ಟಿಸಿದ ಮಾಹಿತಿ ಮಾತ್ರ, ವೈದ್ಯಕೀಯ ನಿರ್ಣಯವಲ್ಲ. ಚಿಕಿತ್ಸೆಗಾಗಿ ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (structuredReport) {
      setReportSummary(buildStandardSummary(structuredReport, lang));
    }
  }, [lang, structuredReport]);

  const showAlert = (message, type = 'warn') => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 6000);
  };

  const handleFileSelect = (file) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setCurrentFile(file);
      setAnalysisDone(false);
      setReportSummary('');
      setStructuredReport(null);
      setMessages([]);
    } else if (file) {
      showAlert('Only image or PDF files are supported');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const callOpenRouter = async (messages, maxTokens = 1200) => {
    if (!apiKey.trim()) {
      throw new Error(t.apiRequired);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Medical Report Agent'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'OpenRouter request failed');
    }

    return data?.choices?.[0]?.message?.content || 'No response.';
  };

  const parseStructuredJson = (raw) => {
    if (typeof raw !== 'string') {
      throw new Error('Model did not return text JSON');
    }

    const cleaned = raw.replace(/```json|```/gi, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(cleaned.slice(start, end + 1));
      }
      throw new Error('Could not parse structured JSON from model response');
    }
  };

  const buildStandardSummary = (data, currentLang = 'en') => {
    const isKannada = currentLang === 'kn';

    const labels = isKannada
      ? {
          title: 'ಪ್ರಮಾಣಿತ ವೈದ್ಯಕೀಯ ವರದಿ ಸಾರಾಂಶ',
          reportType: 'ವರದಿ ಪ್ರಕಾರ',
          patientName: 'ರೋಗಿಯ ಹೆಸರು',
          age: 'ವಯಸ್ಸು',
          gender: 'ಲಿಂಗ',
          date: 'ದಿನಾಂಕ',
          measurements: 'ಮಾಪನಗಳು',
          findings: 'ಕಂಡುಬಂದ ಅಂಶಗಳು',
          impression: 'ವೈದ್ಯಕೀಯ ಅಭಿಪ್ರಾಯ',
          abnormalities: 'ಅಸಾಮಾನ್ಯತೆಗಳು',
          recommendations: 'ಶಿಫಾರಸುಗಳು',
          range: 'ಮಾನದಂಡ',
          status: 'ಸ್ಥಿತಿ',
          missing: 'ಲಭ್ಯವಿಲ್ಲ'
        }
      : {
          title: 'STANDARD MEDICAL REPORT SUMMARY',
          reportType: 'Report Type',
          patientName: 'Patient Name',
          age: 'Age',
          gender: 'Gender',
          date: 'Date',
          measurements: 'Measurements',
          findings: 'Findings',
          impression: 'Impression',
          abnormalities: 'Abnormalities',
          recommendations: 'Recommendations',
          range: 'Range',
          status: 'Status',
          missing: 'null'
        };

    const mapStatus = (status) => {
      if (!isKannada) return status ?? labels.missing;
      const normalized = String(status || '').toLowerCase();
      if (normalized === 'low') return 'ಕಡಿಮೆ';
      if (normalized === 'normal') return 'ಸಾಮಾನ್ಯ';
      if (normalized === 'high') return 'ಹೆಚ್ಚು';
      if (normalized === 'abnormal') return 'ಅಸಾಮಾನ್ಯ';
      if (normalized === 'null' || normalized === '') return labels.missing;
      return status;
    };

    const reportType = data?.report_type ?? labels.missing;
    const patient = data?.patient_info || {};
    const impression = data?.impression ?? labels.missing;

    const measurements = Array.isArray(data?.measurements) ? data.measurements : [];
    const findings = Array.isArray(data?.findings) ? data.findings : [];
    const abnormalities = Array.isArray(data?.abnormalities) ? data.abnormalities : [];
    const recommendations = Array.isArray(data?.recommendations)
      ? data.recommendations
      : [];

    const measurementLines = measurements.length
      ? measurements.map((m, i) => {
          const name = m?.name ?? labels.missing;
          const value = m?.value ?? labels.missing;
          const unit = m?.unit ?? labels.missing;
          const range = m?.reference_range ?? labels.missing;
          const status = mapStatus(m?.status);
          return `${i + 1}. ${name}: ${value} ${unit} | ${labels.range}: ${range} | ${labels.status}: ${status}`;
        })
      : [`1. ${labels.missing}`];

    const findingsLines = findings.length
      ? findings.map((f, i) => `${i + 1}. ${f}`)
      : [`1. ${labels.missing}`];

    const abnormalitiesLines = abnormalities.length
      ? abnormalities.map((a, i) => `${i + 1}. ${a}`)
      : [`1. ${labels.missing}`];

    const recommendationLines = recommendations.length
      ? recommendations.map((r, i) => `${i + 1}. ${r}`)
      : [`1. ${labels.missing}`];

    return [
      labels.title,
      '',
      `${labels.reportType}: ${reportType}`,
      `${labels.patientName}: ${patient?.name ?? labels.missing}`,
      `${labels.age}: ${patient?.age ?? labels.missing}`,
      `${labels.gender}: ${patient?.gender ?? labels.missing}`,
      `${labels.date}: ${patient?.date ?? labels.missing}`,
      '',
      `${labels.measurements}:`,
      ...measurementLines,
      '',
      `${labels.findings}:`,
      ...findingsLines,
      '',
      `${labels.impression}: ${impression}`,
      '',
      `${labels.abnormalities}:`,
      ...abnormalitiesLines,
      '',
      `${labels.recommendations}:`,
      ...recommendationLines
    ].join('\n');
  };

  const analyzeReport = async () => {
    if (!currentFile) {
      showAlert(t.fileRequired);
      return;
    }

    if (!apiKey.trim()) {
      showAlert(t.apiRequired);
      return;
    }

    setIsAnalyzing(true);
    setProgress(5);

    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + 8, 88));
    }, 500);

    try {
      const outputLanguageInstruction =
        lang === 'kn'
          ? `Output language rule:
- JSON keys must stay exactly in English as specified.
- But all text values (report_type, measurement names, findings, impression, abnormalities, recommendations) must be in Kannada only.
- Do not use English words in those text values, except medical abbreviations, symbols, units, and numbers.`
          : `Output language rule:
- Keep JSON keys in English as specified.
- Return text values in clear English.`;

      const extractionPrompt = `You are an expert medical data extraction system.

Your task is to extract ALL important structured information from ANY medical document.

The document may be:
- Blood test report (CBC, biochemistry, etc.)
- MRI / CT / X-ray report
- ECG report
- Pregnancy scan / ultrasound
- Any diagnostic or clinical document

Return STRICT JSON only in the following format:

{
  "report_type": "",
  "patient_info": {
    "name": "",
    "age": "",
    "gender": "",
    "date": ""
  },
  "measurements": [
    {
      "name": "",
      "value": "",
      "unit": "",
      "reference_range": "",
      "status": ""
    }
  ],
  "findings": [],
  "impression": "",
  "abnormalities": [],
  "recommendations": []
}

Rules:
- Extract ALL measurable values (lab values, vitals, readings)
- Extract ALL findings (especially for MRI, X-ray, ECG)
- Do NOT skip any detectable parameter
- Preserve exact numbers and units
- If reference range is available, include it
- Set "status" as "Low", "Normal", "High", or "Abnormal" when possible
- If a field is missing, return null
- Keep findings and abnormalities as separate bullet points
- Do NOT summarize away numeric values
- Do NOT add extra text outside JSON
${outputLanguageInstruction}

IMPORTANT:
If any measurable value or key finding is missing, your output is incorrect.

Medical Document:
Extract from the attached file/image and return JSON only.`;

      let content = [{ type: 'text', text: extractionPrompt }];

      const dataUrl = await fileToDataUrl(currentFile);

      if (currentFile.type === 'application/pdf') {
        content.push({
          type: 'file',
          file: {
            filename: currentFile.name,
            file_data: dataUrl
          }
        });
      } else {
        content.push({
          type: 'image_url',
          image_url: {
            url: dataUrl
          }
        });
      }

      const rawExtraction = await callOpenRouter(
        [
          {
            role: 'user',
            content
          }
        ],
        2500
      );

      const extracted = parseStructuredJson(rawExtraction);

      clearInterval(timer);
      setProgress(100);
      setTimeout(() => setProgress(0), 600);

      setStructuredReport(extracted);
      setReportSummary(buildStandardSummary(extracted, lang));
      setAnalysisDone(true);
      setMessages([{ role: 'system', text: t.welcome }]);
    } catch (error) {
      clearInterval(timer);
      setProgress(0);
      showAlert('Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChat = async (messageToSend) => {
    const userMessage = messageToSend || chatInput.trim();
    if (!userMessage || !reportSummary || isChatLoading) return;

    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);
    setMessages(prev => [...prev, { role: 'thinking', text: t.thinking }]);

    try {
      const prompt = 
        lang === 'en'
          ? `You are a compassionate medical AI assistant.
Answer in simple English.
Keep the answer concise but useful.
If the report summary does not support a claim, say that clearly.
Do NOT use asterisks, markdown formatting, or special symbols in your response.
Write in plain text only.
Always end with a reminder to consult a doctor for medical decisions.

Medical report summary:
${reportSummary}

Structured extracted data (JSON):
${structuredReport ? JSON.stringify(structuredReport, null, 2) : 'null'}

User question:
${userMessage}`
          : `ನೀವು ದಯೆಯುಳ್ಳ ವೈದ್ಯಕೀಯ AI ಸಹಾಯಕ.
ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ.
ಉತ್ತರವನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಆದರೆ ಉಪಯುಕ್ತವಾಗಿ ಇರಿಸಿ.
ವರದಿಯ ಸಾರಾಂಶವು ಹೇಳಿಕೆಯನ್ನು ಬೆಂಬಲಿಸದಿದ್ದರೆ, ಅದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.
ನಿಮ್ಮ ಉತ್ತರದಲ್ಲಿ ಆಸ್ಟರಿಸ್ಕ್ ಅಥವಾ ವಿಶೇಷ ಚಿಹ್ನೆಗಳನ್ನು ಬಳಸಬೇಡಿ.
ಕೇವಲ ಸರಳ ಪಠ್ಯದಲ್ಲಿ ಬರೆಯಿರಿ.
ಎಲ್ಲಾ ಉತ್ತರವೂ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಇರಬೇಕು. ಇಂಗ್ಲಿಷ್ ಪದಗಳನ್ನು ಬಳಸಬೇಡಿ.
ಯಾವುದೇ ಇಂಗ್ಲಿಷ್ ಪದ ಬರೆದಿದ್ದರೆ, ಅದೇ ಉತ್ತರವನ್ನು ಮರುಬರೆದು ಕನ್ನಡದಲ್ಲೇ ಕೊಡಿ.
ವೈದ್ಯಕೀಯ ನಿರ್ಧಾರಗಳಿಗಾಗಿ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸುವ ಜ್ಞಾಪನೆಯೊಂದಿಗೆ ಯಾವಾಗಲೂ ಕೊನೆಗೊಳಿಸಿ.

ವೈದ್ಯಕೀಯ ವರದಿ ಸಾರಾಂಶ:
${reportSummary}

ಸಂರಚಿತ ಹೊರತೆಗೆದ ಮಾಹಿತಿ (JSON):
${structuredReport ? JSON.stringify(structuredReport, null, 2) : 'null'}

ಬಳಕೆದಾರರ ಪ್ರಶ್ನೆ:
${userMessage}`;

      const reply = await callOpenRouter(
        [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }]
          }
        ],
        700
      );

      const finalReply =
        typeof reply === 'string' ? reply : JSON.stringify(reply, null, 2);

      setMessages(prev => prev.filter(m => m.role !== 'thinking'));
      setMessages(prev => [...prev, { role: 'agent', text: finalReply }]);
      speak(finalReply, () => {
        if (isVoiceConversationActive) {
          setTimeout(() => toggleMic(), 500);
        }
      });
    } catch (error) {
      setMessages(prev => prev.filter(m => m.role !== 'thinking'));
      setMessages(prev => [...prev, { role: 'agent', text: 'Error: ' + error.message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const cleanTextForSpeech = (text) => {
    // Remove asterisks, markdown symbols, and other formatting
    let cleaned = text
      .replace(/\*+/g, '') // Remove all asterisks
      .replace(/#+/g, '') // Remove hash symbols
      .replace(/_+/g, '') // Remove underscores
      .replace(/`+/g, '') // Remove backticks
      .replace(/\[|\]/g, '') // Remove square brackets
      .replace(/\(|\)/g, '') // Remove parentheses from formatting
      .replace(/\-{2,}/g, '') // Remove multiple dashes
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
    
    return cleaned;
  };

  const speak = (text, onEndCallback) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) {
        onEndCallback();
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEndCallback) {
        onEndCallback();
      }
    };

    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (lang === 'kn') {
        utterance.lang = 'kn-IN';
        selectedVoice =
          voices.find(v => v.lang === 'kn-IN') ||
          voices.find(v => v.lang.startsWith('kn')) ||
          voices.find(v => v.lang === 'hi-IN') ||
          voices.find(v => v.lang === 'en-IN') ||
          voices.find(v => v.lang.startsWith('en'));
      } else {
        utterance.lang = 'en-IN';
        selectedVoice =
          voices.find(v => v.lang === 'en-IN') ||
          voices.find(v => v.lang.startsWith('en'));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
    } else {
      setVoiceAndSpeak();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleMic = () => {
    if (!reportSummary) {
      showAlert('Please analyze a report first');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showAlert('Microphone not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      finalTranscriptRef.current = transcript;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscriptRef.current) {
        sendChat(finalTranscriptRef.current);
        finalTranscriptRef.current = '';
      }
    };
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  // Load voices when they become available
  useEffect(() => {
    if (window.speechSynthesis) {
      // Load voices
      window.speechSynthesis.getVoices();
      
      // Some browsers need this event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-serif">{t.title}</h1>
        </div>

        <p className="text-sm text-gray-600 mb-6">{t.subtitle}</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLang('en')}
            className={`px-5 py-2 rounded-full text-sm transition-all ${
              lang === 'en'
                ? 'bg-emerald-600 text-white'
                : 'bg-transparent border border-gray-300 text-gray-600'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('kn')}
            className={`px-5 py-2 rounded-full text-sm transition-all ${
              lang === 'kn'
                ? 'bg-emerald-600 text-white'
                : 'bg-transparent border border-gray-300 text-gray-600'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>



        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-3 ${
              alert.type === 'warn'
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{alert.message}</span>
          </div>
        ))}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-gray-700 mb-1">{t.uploadLabel}</p>
          <p className="text-xs text-gray-500">{t.uploadSub}</p>
        </div>

        {currentFile && (
          <div className="flex items-center gap-3 mt-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-emerald-800">
              {currentFile.name} ({(currentFile.size / 1024).toFixed(0)} KB)
            </span>
          </div>
        )}

        {progress > 0 && (
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={analyzeReport}
          disabled={!currentFile || isAnalyzing}
          className={`w-full mt-4 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
            currentFile && !isAnalyzing
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.analyzing}</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>{t.analyzeBtn}</span>
            </>
          )}
        </button>

        {analysisDone && (
          <>
            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                {t.summaryTitle}
              </p>
              <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                {reportSummary}
              </p>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => isSpeaking ? stopSpeaking() : speak(reportSummary)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  {isSpeaking ? 'Stop' : t.readAloud}
                </button>
                <button
                  onClick={() => setIsVoiceConversationActive(true)}
                  className="px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50 text-sm text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Start Voice Conversation
                </button>
              </div>
            </div>

            {isVoiceConversationActive && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                  <h2 className="text-2xl font-bold mb-4">Voice Conversation</h2>
                  <p className="text-gray-600 mb-6">Ask me anything about your report. I'm listening.</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={toggleMic}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isListening ? 'bg-orange-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <Mic className="w-10 h-10 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setIsVoiceConversationActive(false);
                        if (isListening) {
                          toggleMic();
                        }
                      }}
                      className="w-24 h-24 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                    >
                      Stop
                    </button>
                  </div>
                  {chatInput && <p className="mt-4 text-center text-gray-500">You said: {chatInput}</p>}
                </div>
              </div>
            )}

            <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                {t.chatTitle}
              </p>

              <div ref={chatAreaRef} className="max-h-80 overflow-y-auto mb-4 space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : msg.role === 'agent'
                          ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          : 'bg-transparent text-gray-500 text-center'
                      }`}
                    >
                      {msg.text}
                      {msg.role === 'agent' && (
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text)}
                          className="mt-2 px-3 py-1 rounded-full border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          {isSpeaking ? 'Stop' : t.readAloud}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-orange-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Mic className="w-5 h-5 text-white" />
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder={t.placeholder}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500"
                />

                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || isChatLoading}
                  className={`px-5 py-3 rounded-lg font-medium transition-all ${
                    chatInput.trim() && !isChatLoading
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {isChatLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isListening && (
                <p className="mt-3 text-xs text-gray-500 text-center bg-gray-100 py-2 rounded-lg">
                  {t.micStart}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MedicalReportAgent;