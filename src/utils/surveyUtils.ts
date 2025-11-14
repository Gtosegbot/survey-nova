// Utility functions for survey operations

export const generateUniqueId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getDeviceId = (): string => {
  // Check if device ID exists in localStorage
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = generateUniqueId();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

export const extractRespondentData = (messages: any[]): any => {
  // Extract name, age, location from conversation
  const data: any = {};
  
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Extract name (simple heuristic)
      if (content.includes('meu nome é') || content.includes('me chamo')) {
        const nameMatch = content.match(/(?:meu nome é|me chamo)\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i);
        if (nameMatch) data.name = nameMatch[1].trim();
      }
      
      // Extract age
      const ageMatch = content.match(/\b(\d{1,2})\s*anos?\b/);
      if (ageMatch) data.age = parseInt(ageMatch[1]);
      
      // Extract location
      if (content.includes('moro') || content.includes('cidade')) {
        const locationMatch = content.match(/(?:moro em|cidade de?)\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i);
        if (locationMatch) data.location = locationMatch[1].trim();
      }
    }
  });
  
  return data;
};

export const extractDemographics = (messages: any[]): any => {
  const data = extractRespondentData(messages);
  return {
    age: data.age || null,
    location: data.location || null,
  };
};

export const extractAnswers = (messages: any[]): any[] => {
  // Extract Q&A pairs from conversation
  const answers: any[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.content.includes('?')) {
      const nextMsg = messages[i + 1];
      if (nextMsg && nextMsg.role === 'user') {
        answers.push({
          question: msg.content,
          answer: nextMsg.content,
        });
      }
    }
  }
  
  return answers;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateCost = (contacts: number, channelType: string): number => {
  const costs: Record<string, number> = {
    email: 0.01,
    sms: 0.15,
    whatsapp: 0.10,
  };
  
  return contacts * (costs[channelType] || 0);
};
