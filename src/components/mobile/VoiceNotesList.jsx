import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

export default function VoiceNotesList({ voiceNotes = [], onDelete }) {
  const [playing, setPlaying] = React.useState(null);
  const audioRefs = React.useRef({});

  const togglePlay = (noteId, url) => {
    // Stop all other audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
      }
    });

    const audio = audioRefs.current[noteId];
    if (!audio) {
      const newAudio = new Audio(url);
      audioRefs.current[noteId] = newAudio;
      newAudio.play();
      setPlaying(noteId);
      newAudio.onended = () => setPlaying(null);
    } else if (playing === noteId) {
      audio.pause();
      setPlaying(null);
    } else {
      audio.play();
      setPlaying(noteId);
    }
  };

  if (!voiceNotes || voiceNotes.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Voice Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {voiceNotes.map((note, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => togglePlay(idx, note.url)}
                className="h-8 w-8 p-0"
              >
                {playing === idx ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Voice Note {idx + 1}
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(note.timestamp), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(note.url, '_blank')}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(idx)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}