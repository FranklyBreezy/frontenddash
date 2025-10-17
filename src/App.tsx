import React, { useState } from 'react';
import KeyManager from './components/KeyManager';
import EncryptForm from './components/EncryptForm';
import ChannelAndMessageView from './components/ChannelAndMessageView';
import MessageBox from './components/MessageBox';
import { ViewType } from './types';

// Custom styling is applied using Tailwind and a style block for the pastel/matte dark mode
export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messageBox, setMessageBox] = useState<{ title: string; message: string }>({ title: '', message: '' });
  
  // New State for Channel Navigation
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'inbox' });

  const showMessage = (title: string, message: string) => setMessageBox({ title, message });
  const hideMessage = () => setMessageBox({ title: '', message: '' });

  return (
    // Centered, full-screen container with a soothing dark background
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#1f2130] font-sans text-gray-100 transition-colors duration-300">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        /* Pastel/Matte Color Palette */
        :root {
            --bg-card: #2f3248;       /* Soothing dark gray/blue for card background */
            --color-primary: #a3c4f3; /* Pale Lavender/Soft Blue (Soothing primary action color) */
            --color-success: #b5e8a0; /* Sage Green (Relaxing success color) */
            --color-text-dim: #94a3b8; /* Muted text color */
        }

        .card { 
            background-color: var(--bg-card);
            border-radius: 1.5rem; 
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.2); /* Deep, soft shadow */
            transition: all 0.3s ease;
        }

        .label { font-size: 13px; color: var(--color-text-dim); margin-bottom: 4px; font-weight: 600; text-transform: uppercase; }
        
        .input { 
            width: 100%; padding: 10px; border-radius: 12px; 
            background-color: #262939; /* Slightly darker than card for contrast */
            border: 1px solid #3e4256; /* Subtle border */
            color: white; font-size: 15px; 
            transition: border-color 0.2s, box-shadow 0.2s; 
        }
        .input:focus { 
            outline: none; 
            border-color: var(--color-primary); 
            box-shadow: 0 0 0 2px var(--color-primary), inset 0 1px 3px rgba(0, 0, 0, 0.5); /* Matte inner shadow */
        }
        
        .btn { 
            padding: 12px 20px; border-radius: 10px; font-weight: 700; 
            transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s; 
            display: inline-block; text-transform: uppercase; letter-spacing: 0.02em; 
            box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.2); /* Matte depth effect */
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 -3px 0 rgba(0, 0, 0, 0.2); }
        .btn:active { transform: translateY(0); box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.4); }
        
        .btn-primary { background-color: var(--color-primary); color: #1f2130; } /* Dark text on light pastel */
        .btn-primary:hover { background-color: #92bce9; }
        
        .btn-success { background-color: var(--color-success); color: #1f2130; } /* Dark text on sage green */
        .btn-success:hover { background-color: #aae095; }
        
        .btn-ghost { background-color: transparent; color: var(--color-text-dim); border: 1px solid #3e4256; }
        .btn-ghost:hover { background-color: #3e4256; color: white; }
        `}
      </style>
      
      {/* Centrally Aligned Main Content Card */}
      <div className="w-full max-w-6xl h-auto xl:h-[90vh] flex flex-col xl:flex-row card p-6 space-y-6 xl:space-y-0 xl:space-x-6">

        {/* 1. Left Column: Key Manager & Encrypt Form (50% Width on Desktop) */}
        <div className="flex flex-col space-y-6 xl:w-1/2">
            
            {/* Header / Branding */}
            <div className="flex items-center gap-4 border-b border-[#3e4256] pb-4">
                <div className="bg-indigo-600 text-white font-extrabold text-xl p-3 rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                    MM
                </div>
                <div>
                    <div className="text-xl font-extrabold text-white">MIDI Messenger</div>
                    <div className="text-sm text-gray-400 font-medium">Secure Communications Interface</div>
                </div>
            </div>

            {/* Key Manager (Must contain all parts) */}
            <div className="flex-shrink-0">
              <KeyManager userId={userId} setUserId={setUserId} showMessage={showMessage} />
            </div>

            {/* Encrypt Form (Must contain all parts) */}
            <div className="flex-1 min-h-[250px] p-4 rounded-xl bg-[#262939]">
                <EncryptForm 
                    userId={userId} 
                    showMessage={showMessage} 
                    currentView={currentView}
                />
            </div>
        </div>
        
        {/* 2. Right Column: Channel & Message View (50% Width on Desktop) */}
        <div className="flex-1 flex flex-col xl:w-1/2 p-0 rounded-xl bg-[#262939] overflow-hidden shadow-inner">
            <ChannelAndMessageView 
                userId={userId} 
                showMessage={showMessage} 
                currentView={currentView}
                setCurrentView={setCurrentView}
            />
        </div>
      </div>
      
      <MessageBox {...messageBox} onClose={hideMessage} />
    </div>
  );
}