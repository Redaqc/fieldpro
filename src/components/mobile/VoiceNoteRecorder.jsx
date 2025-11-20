import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceNoteRecorder({ onSave }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setPlaying(false);
  };

  const saveRecording = async () => {
    if (!audioURL) return;

    setUploading(true);
    try {
      const response = await fetch(audioURL);
      const blob = await response.blob();
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      onSave({
        url: file_url,
        duration: audioRef.current?.duration || 0,
        timestamp: new Date().toISOString()
      });

      deleteRecording();
    } catch (error) {
      alert('Failed to upload voice note');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Voice Note</h3>
          {recording && <span className="text-red-600 animate-pulse">● Recording...</span>}
        </div>

        {!audioURL ? (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={recording ? stopRecording : startRecording}
              className={recording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {recording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <audio
              ref={audioRef}
              src={audioURL}
              onEnded={() => setPlaying(false)}
              className="w-full"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={playing ? pauseAudio : playAudio}
                className="flex-1"
              >
                {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {playing ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="ghost"
                onClick={deleteRecording}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={saveRecording}
              disabled={uploading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {uploading ? 'Uploading...' : 'Save Voice Note'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}