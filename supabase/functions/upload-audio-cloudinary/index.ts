import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, filename, surveyId, userId } = await req.json();

    if (!audioData || !filename) {
      throw new Error('Audio data and filename are required');
    }

    console.log('📤 Uploading audio to Cloudinary:', { filename, surveyId });

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/upload`;
    
    const formData = new FormData();
    formData.append('file', audioData);
    formData.append('upload_preset', 'ml_default');
    formData.append('resource_type', 'auto');
    formData.append('folder', `survey-audio/${surveyId}`);
    
    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!cloudinaryResponse.ok) {
      throw new Error(`Cloudinary upload failed: ${await cloudinaryResponse.text()}`);
    }

    const cloudinaryResult = await cloudinaryResponse.json();
    console.log('✅ Cloudinary upload successful:', cloudinaryResult.secure_url);

    // Also upload to Supabase Storage as backup
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const audioBuffer = Uint8Array.from(atob(audioData.split(',')[1]), c => c.charCodeAt(0));
    
    const storagePath = `${userId}/${surveyId}/${filename}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('survey-audio')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/webm',
        upsert: true
      });

    if (storageError) {
      console.error('⚠️ Supabase storage upload failed:', storageError);
    } else {
      console.log('✅ Supabase storage upload successful:', storagePath);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cloudinaryUrl: cloudinaryResult.secure_url,
        supabaseUrl: storageData ? `${supabaseUrl}/storage/v1/object/public/survey-audio/${storagePath}` : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});