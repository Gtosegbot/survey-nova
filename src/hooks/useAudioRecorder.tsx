import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Gravação iniciada 🎤",
        description: "Fale sua resposta agora.",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erro ao iniciar gravação",
        description: "Verifique as permissões do microfone.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Gravação finalizada ✓",
        description: "Áudio salvo com sucesso.",
      });
    }
  }, [isRecording, toast]);

  const uploadAudio = useCallback(async (surveyId: string, userId: string) => {
    if (!audioUrl) {
      throw new Error('No audio to upload');
    }

    setIsUploading(true);
    
    try {
      // Convert blob URL to base64
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const filename = `audio-${Date.now()}.webm`;

      console.log('📤 Uploading audio to Cloudinary and Supabase...');
      
      // Upload to Cloudinary and Supabase
      const { data, error } = await supabase.functions.invoke('upload-audio-cloudinary', {
        body: { 
          audioData: base64Audio, 
          filename,
          surveyId,
          userId
        }
      });

      if (error) throw error;

      console.log('✅ Audio uploaded successfully:', data);
      
      toast({
        title: "Áudio enviado com sucesso! 🎉",
        description: "Seu áudio foi salvo de forma segura.",
      });

      return data.cloudinaryUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "Erro ao enviar áudio",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [audioUrl, toast]);

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    audioUrl,
    isUploading,
    startRecording,
    stopRecording,
    uploadAudio,
    clearAudio
  };
};