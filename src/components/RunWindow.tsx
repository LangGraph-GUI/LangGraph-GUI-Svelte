// components/RunWindow.tsx

import { useState, useEffect, useRef } from 'react';
import SERVER_URL from '../config';
import { useGraph } from '../Graph/GraphContext';
import { allSubGraphsToJson } from '../Graph/JsonUtil';
import ConfigManager from '../ConfigManager';

interface RunWindowProps {
    onClose: () => void;
}


function RunWindow({ onClose }: RunWindowProps) {
    const [responseMessage, setResponseMessage] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const { username, llmModel, apiKey } = ConfigManager.getSettings();
    const { subGraphs } = useGraph();
    const isPollingRef = useRef(false);



    const saveGraphData = async () => {
        try {
            const flowData = allSubGraphsToJson(subGraphs);
            if (!username) {
                throw new Error("Username not available to save graph data.");
            }
            const response = await fetch(`${SERVER_URL}/save-graph/${encodeURIComponent(username)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flowData),
            });


            if (!response.ok) {
                throw new Error('Failed to save graph data on the server.');
            }


            console.log('Graph data successfully saved to server.\n');
            setResponseMessage(prev => prev + '\nGraph data successfully saved to server.\n');
        } catch (error: unknown) {
            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error('Error saving graph data:', errorMessage);
            setResponseMessage(prev => prev + '\nError saving graph data: ' + errorMessage);
            throw error;
        }
    };


    const handleRun = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setResponseMessage('');


        try {
            await saveGraphData();
            console.log("Attempting to send request to Flask server...");

            if (!username) {
                throw new Error("Username not available to run.");
            }

            const response = await fetch(`${SERVER_URL}/run/${encodeURIComponent(username)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    llm_model: llmModel,
                    api_key: apiKey,
                }),
            });


            if (!response.body) {
                throw new Error('ReadableStream not yet supported in this browser.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;


            while (!done) {
                const { value, done: streamDone } = await reader.read();
                done = streamDone;
                if (value) {
                    const chunk = decoder.decode(value, { stream: !done });
                    console.log("Received chunk:", chunk);
                    try{
                        const parsed = JSON.parse(chunk.replace("data: ", "").trim());
                        if (parsed.status){
                            setIsRunning(false)
                        }
                    }catch(e){

                    }
                    setResponseMessage(prev => prev + chunk);
                }
            }
        }  catch (error: unknown) {
            let errorMessage = "An unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error('Error:', errorMessage);
            setResponseMessage(prev => prev + '\nError: ' + errorMessage);
            alert('Error: ' + errorMessage);
            setIsRunning(false);
        }  finally {
            if(isPollingRef.current){
                setIsRunning(false);
            }
        }
    };


    useEffect(() => {
        isPollingRef.current = true;
        const checkStatus = async () => {
            try {
                if (!username) {
                    throw new Error("Username not available to check status.");
                }

                const response = await fetch(`${SERVER_URL}/status/${encodeURIComponent(username)}`, {
                    method: 'GET',
                });
                const status = await response.json();
                setIsRunning(status.running);
            } catch (error) {
                console.error('Error checking status:', error);
            }
        };
        const interval = setInterval(checkStatus, 2000);


        return () => {
            isPollingRef.current = false;
            clearInterval(interval);
        };
    }, [username]);


    const handleLeave = async () => {
        onClose();
    };


    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-1000">
            <div className="bg-white p-5 rounded shadow-md w-4/5 h-4/5 flex flex-col">
                <h2 className="text-lg font-bold mb-4">Run Script</h2>
                <div className="flex mb-4 justify-end"> {/* Changed here */}
                    <button
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 ${isRunning ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                        onClick={handleRun}
                        disabled={isRunning}
                    >
                        Run
                    </button>
                    <button
                        className={`bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded mr-2 ${isRunning ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                        onClick={handleLeave}
                        disabled={isRunning}
                    >
                        Leave
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-100 p-2 rounded mt-4">
                    <pre className="text-left whitespace-pre-wrap">{responseMessage}</pre>
                </div>
            </div>
        </div>
    );
}


export default RunWindow;