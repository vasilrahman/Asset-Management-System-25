
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Download, Loader } from 'lucide-react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export const AdminGenerateQR = () => {
  const { createDummyAssets } = useApp();
  const [count, setCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (count < 1 || count > 100) {
        alert("Please enter a number between 1 and 100.");
        return;
    }

    setIsGenerating(true);
    
    try {
        // 1. Create Dummy Assets in DB
        const newAssets = await createDummyAssets(count);
        
        // 2. Generate PDF
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("AMS - Unassigned QR Codes", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

        // Grid Configuration
        const cols = 4;
        const startX = 15;
        const startY = 30;
        const cellWidth = 45; // slightly larger than 40mm to accommodate padding
        const cellHeight = 55; // 40mm QR + text
        const marginX = 5;
        const marginY = 5;

        let col = 0;
        let row = 0;

        for (const asset of newAssets) {
            const x = startX + col * (cellWidth + marginX);
            const y = startY + row * (cellHeight + marginY);

            // Draw Border for sticker
            doc.setDrawColor(200, 200, 200);
            doc.rect(x, y, cellWidth, cellHeight);

            // Generate QR Data URL
            const qrUrl = await QRCode.toDataURL(JSON.stringify({ assetId: asset.id }), { width: 400, margin: 1 });
            doc.addImage(qrUrl, 'PNG', x + 2.5, y + 2.5, 40, 40);

            // Text Label - ID Format Only - REMOVED "Scan to Register"
            doc.setFontSize(10);
            doc.text(`ID: ${asset.id}`, x + cellWidth/2, y + 50, { align: 'center' });

            col++;
            if (col >= cols) {
                col = 0;
                row++;
                // Check if new page needed
                if (startY + (row + 1) * (cellHeight + marginY) > 280) {
                    doc.addPage();
                    row = 0;
                }
            }
        }

        doc.save(`AMS_QR_Batch_${Date.now()}.pdf`);
        alert(`${count} QR Codes generated and downloaded successfully.`);
        setCount(1);

    } catch (error) {
        console.error("Generation failed", error);
        alert("Failed to generate QR codes.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Generate QR Codes</h1>
        <p className="text-slate-500 dark:text-slate-400">Create bulk "dummy" QR codes to print and stick on assets. These can later be scanned by staff to register asset details.</p>

        <form onSubmit={handleGenerate} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Number of QR Codes</label>
                <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={count} 
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 dark:text-white"
                />
                <p className="text-xs text-slate-400">Enter a value between 1 and 100.</p>
            </div>

            <div className="mt-8">
                <button 
                    type="submit" 
                    disabled={isGenerating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader className="animate-spin" size={20} /> : <QrCode size={20} />}
                    {isGenerating ? 'Generating...' : 'Generate & Download PDF'}
                </button>
            </div>
            
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                    <Download size={16} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">How it works</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        1. Generate a PDF with unique QR stickers.<br/>
                        2. Print and stick them on physical assets.<br/>
                        3. Use the Staff App's "Register QR" to scan and link the asset details.
                    </p>
                </div>
            </div>
        </form>
    </div>
  );
};
