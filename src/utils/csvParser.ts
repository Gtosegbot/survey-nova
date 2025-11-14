// CSV/Excel parsing utilities

export interface ParsedContact {
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export const parseCSV = async (file: File): Promise<ParsedContact[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('Arquivo vazio'));
          return;
        }
        
        // First line is header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Find column indices
        const nameIndex = headers.findIndex(h => h.includes('nome') || h.includes('name'));
        const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
        const phoneIndex = headers.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular'));
        
        if (nameIndex === -1) {
          reject(new Error('Coluna "nome" não encontrada'));
          return;
        }
        
        const contacts: ParsedContact[] = [];
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length < headers.length) continue;
          
          const contact: ParsedContact = {
            name: values[nameIndex],
          };
          
          if (emailIndex !== -1 && values[emailIndex]) {
            contact.email = values[emailIndex];
          }
          
          if (phoneIndex !== -1 && values[phoneIndex]) {
            contact.phone = values[phoneIndex];
          }
          
          // Add other columns as metadata
          headers.forEach((header, index) => {
            if (index !== nameIndex && index !== emailIndex && index !== phoneIndex && values[index]) {
              contact[header] = values[index];
            }
          });
          
          contacts.push(contact);
        }
        
        resolve(contacts);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

export const parseExcel = async (file: File): Promise<ParsedContact[]> => {
  // For simplicity, we'll treat Excel as CSV for now
  // In production, you'd use a library like xlsx
  return parseCSV(file);
};

export const detectColumns = (headers: string[]): { name?: number; email?: number; phone?: number } => {
  const normalized = headers.map(h => h.toLowerCase().trim());
  
  return {
    name: normalized.findIndex(h => h.includes('nome') || h.includes('name')),
    email: normalized.findIndex(h => h.includes('email') || h.includes('e-mail')),
    phone: normalized.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular')),
  };
};
