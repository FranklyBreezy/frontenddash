    import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import crypto from '../lib/client_crypto';
    import { ChannelMessageProps, MessageItem, PrivateKey, PublicChannel, ViewType } from '../types';
    import { MessageSquare, Mail, Plus } from 'lucide-react';

    // Use a simple polling mechanism to simulate real-time updates from Flask
    const POLLING_INTERVAL = 5000; 

    const ChannelAndMessageView: React.FC<ChannelMessageProps> = ({ userId, showMessage, currentView, setCurrentView }) => {
        const [inboxMessages, setInboxMessages] = useState<MessageItem[]>([]);
        const [publicChannels, setPublicChannels] = useState<PublicChannel[]>([]);
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const [newChannelName, setNewChannelName] = useState<string>('');
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        
        // --- Channel Management Functions ---

        const fetchChannels = useCallback(async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/list_channels`);
                if (response.ok) {
                    const data: PublicChannel[] = await response.json();
                    setPublicChannels(data);
                }
            } catch (err) {
                console.error("Error fetching channels:", err);
            }
        }, [apiBaseUrl]); // Removed showMessage dependency

        const handleCreateChannel = async () => {
            if (!userId) {
                showMessage('Error', 'Please log in to create a channel.');
                return;
            }
            if (!newChannelName.trim()) {
                showMessage('Error', 'Channel name cannot be empty.');
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/create_channel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newChannelName.trim(), creator_id: userId }),
                });
                const data = await response.json();
                if (response.ok) {
                    showMessage('Success', `Channel '#${data.name}' created!`);
                    setNewChannelName('');
                    fetchChannels(); // Refresh channel list
                    setCurrentView({ type: 'channel', id: data.channel_id, name: data.name });
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                console.error(err);
                showMessage('Error', 'Channel creation failed: ' + ((err as Error).message ?? 'unknown'));
            }
        };

        // --- Message Fetching and Decryption Logic ---

        const fetchMessages = useCallback(async () => {
            if (!userId) {
                setInboxMessages([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // 1. Determine which endpoint to call
                let endpoint = '';
                if (currentView.type === 'inbox') {
                    endpoint = `${apiBaseUrl}/inbox/${userId}`;
                } else if (currentView.type === 'channel') {
                    endpoint = `${apiBaseUrl}/channel_messages/${currentView.id}`;
                } else {
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch message metadata
                const metadataResponse = await fetch(endpoint);
                const metadata: MessageItem[] = await metadataResponse.json();
                
                // 3. Get Private Key
                const privateKeyData = localStorage.getItem('privateKey');
                if (!privateKeyData) {
                    // If no private key, show messages as undecrypted
                    setInboxMessages(metadata.map(item => ({ ...item, decryptedText: '[Undecrypted - Missing Key]', isDecrypted: false })));
                    setIsLoading(false);
                    return;
                }
                const privateKey: PrivateKey = JSON.parse(privateKeyData);

                // 4. Download and Decrypt all messages
                const decryptedMessages = await Promise.all(metadata.map(async (item) => {
                    try {
                        const downloadResponse = await fetch(`${apiBaseUrl}/download_midi/${item.msg_id}`);
                        const downloadData = await downloadResponse.json();
                        
                        if (!downloadResponse.ok) {
                            return { ...item, decryptedText: `[Download Error: ${downloadData.error}]`, isDecrypted: false };
                        }

                        const ciphertext = downloadData.ciphertext;
                        const plaintext = crypto.customDecryptToString(ciphertext, privateKey);
                        
                        return { ...item, decryptedText: plaintext, isDecrypted: true };
                    } catch (e) {
                        console.error(`Decryption failed for ${item.msg_id}:`, e);
                        return { ...item, decryptedText: '[Decryption Failed]', isDecrypted: false };
                    }
                }));
                
                setInboxMessages(decryptedMessages.reverse()); // Reverse for typical chat display
            } catch (err) {
                console.error("Error fetching messages:", err);
                // showMessage("Error", "Failed to load messages: " + ((err as Error).message ?? 'unknown'));
            }
            setIsLoading(false);
        }, [apiBaseUrl, userId, currentView]); // Removed showMessage dependency

        // --- Polling Effects ---
        useEffect(() => {
            fetchChannels();
            // Channel polling is less frequent since they are relatively static
            const channelInterval = setInterval(fetchChannels, 15000); 
            return () => clearInterval(channelInterval);
        }, [fetchChannels]);

        useEffect(() => {
            fetchMessages();
            // Message polling is more frequent to simulate chat updates
            const messageInterval = setInterval(fetchMessages, POLLING_INTERVAL);
            return () => clearInterval(messageInterval);
        }, [fetchMessages]);


        // --- UI Rendering ---

        const currentTitle = currentView.type === 'inbox' ? 'Direct Message Inbox' : `Channel: #${currentView.name}`;
        
        // UI for the Message List
        const messageList = useMemo(() => {
            if (isLoading) {
                return <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">Loading and decrypting...</div>;
            }
            if (inboxMessages.length === 0) {
                return <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">No messages found in this view.</div>;
            }
            
            return (
                <ul className="space-y-3 flex-grow overflow-y-auto p-4">
                    {inboxMessages.map(item => (
                        <li key={item.msg_id} className={`p-4 rounded-xl shadow-md transition-colors ${item.sender === userId ? 'bg-indigo-100 dark:bg-indigo-900 text-right ml-auto max-w-xs' : 'bg-gray-100 dark:bg-gray-700 max-w-xs'}`}>
                            <div className={`text-xs font-semibold mb-1 ${item.sender === userId ? 'text-indigo-600 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-300'}`}>
                                {item.sender === userId ? 'You' : `Sender ID: ${item.sender}`}
                            </div>
                            <div className="text-sm break-words whitespace-pre-wrap">
                                {item.decryptedText}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">ID: {item.msg_id}</div>
                        </li>
                    ))}
                </ul>
            );
        }, [isLoading, inboxMessages, userId]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                
                {/* Sidebar (Channel List & Creator) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col md:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Channels & Views</h2>
                    
                    {/* Channel Creator */}
                    <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">New Channel</h3>
                        <input
                            className="input text-sm"
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            placeholder="e.g. general-chat"
                        />
                        <button className="btn btn-primary w-full text-sm" onClick={handleCreateChannel} disabled={!userId}>
                            <Plus size={16} className="inline mr-1" /> Create
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex-grow overflow-y-auto space-y-1">
                        <div
                            onClick={() => setCurrentView({ type: 'inbox' })}
                            className={`p-3 rounded-xl cursor-pointer flex items-center transition-all ${
                                currentView.type === 'inbox' ? 'bg-indigo-100 dark:bg-indigo-700/50 font-bold text-indigo-700 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            <Mail size={20} className="mr-3" /> DM Inbox
                        </div>
                        <h4 className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300">Public Channels</h4>
                        {publicChannels.map(channel => (
                            <div
                                key={channel.channel_id}
                                onClick={() => setCurrentView({ type: 'channel', id: channel.channel_id, name: channel.name })}
                                className={`p-3 rounded-xl cursor-pointer flex items-center transition-all ${
                                    currentView.type === 'channel' && currentView.id === channel.channel_id ? 'bg-indigo-100 dark:bg-indigo-700/50 font-bold text-indigo-700 dark:text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                            >
                                <MessageSquare size={16} className="mr-3" /> #{channel.name}
                            </div>
                        ))}
                        {publicChannels.length === 0 && <p className="text-xs text-gray-500 p-2">No channels yet.</p>}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="bg-white dark:bg-gray-800 p-0 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col md:col-span-3">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentTitle}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {currentView.type === 'channel' ? `ID: ${currentView.id}` : 'Direct messages addressed to your user ID.'}
                        </p>
                    </div>
                    {messageList}
                </div>
            </div>
        );
    };

    export default ChannelAndMessageView;
