import { useState, useRef } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [languageOption, setLanguageOption] = useState('eng-to-urd'); // Default option
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const apiURL = "https://7d4f-34-19-19-230.ngrok-free.app/upload-audio"; // Replace with your API URL

  // File upload handler
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Handle language option change
  const handleLanguageChange = (event) => {
    setLanguageOption(event.target.value);
  };

  // Function to send uploaded audio file to the backend
  const sendAudioAsBinary = async () => {
    if (!selectedFile) {
      alert("Please select an audio file first!");
      return;
    }
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const response = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Translation-Direction": languageOption, // Send selected language option
        },
        body: arrayBuffer,
      });
      const result = await response.json();
      setTranscription(result.transcription);
      setTranslation(result.translation);
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/ogg; codecs=opus" });
        audioChunksRef.current = []; // Clear for next recording

        // Send recorded audio to the backend
        const arrayBuffer = await audioBlob.arrayBuffer();
        const response = await fetch(apiURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Translation-Direction": languageOption, // Send selected language option
          },
          body: arrayBuffer,
        });
        const result = await response.json();
        setTranscription(result.transcription);
        setTranslation(result.translation);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <h1>Audio Processing App</h1>

      {/* Language Selection */}
      <div>
        <h2>Select Translation Direction</h2>
        <select value={languageOption} onChange={handleLanguageChange}>
          <option value="eng-to-urd">English to Urdu</option>
          <option value="urd-to-eng">Urdu to English</option>
        </select>
      </div>

      {/* File Upload Section */}
      <div>
        <h2>Upload Audio File</h2>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        {selectedFile && <button onClick={sendAudioAsBinary}>Upload Audio</button>}
      </div>

      {/* Real-time Recording Section */}
      <div>
        <h2>Record Audio</h2>
        {isRecording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
      </div>

      {/* Display Results */}
      <div>
        {transcription && <p><strong>Transcription:</strong> {transcription}</p>}
        {translation && <p><strong>Translation:</strong> {translation}</p>}
      </div>
    </div>
  );
}
