
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppData } from "../types";

export const controlTools: FunctionDeclaration[] = [
  {
    name: 'add_invoice',
    description: 'إنشاء فاتورة جديدة (مبيعات أو مشتريات)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['SALE', 'PURCHASE'] },
        personName: { type: Type.STRING },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { itemName: { type: Type.STRING }, quantity: { type: Type.NUMBER } },
            required: ['itemName', 'quantity']
          }
        },
        paymentMethod: { type: Type.STRING, enum: ['CASH', 'CREDIT'] }
      },
      required: ['type', 'personName', 'items'],
    },
  },
  // ... rest of tools definitions remain ...
];

export const getAIAssistance = async (prompt: string, appData: AppData) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const totalSales = appData.invoices.filter(i => i.type === 'SALE').reduce((acc, i) => acc + i.total, 0);
    const currency = appData.settings.currency || 'ر.س';

    const systemInstruction = `
      أنت "المحاسب الذكي" لـ LedgerPro.
      لديك صلاحية التحكم في المخزون، الأشخاص، الفواتير، والسندات.
      
      سياق البيانات الحالية:
      - عدد الأصناف: ${appData.inventory.length}
      - إجمالي المبيعات: ${totalSales} ${currency}
      
      تحدث باحترافية ونفذ الأوامر بدقة مالية. النظام حالياً لا يستخدم الضرائب.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: controlTools }],
        temperature: 0.3,
      }
    });

    return response;
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
