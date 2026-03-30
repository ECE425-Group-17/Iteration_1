async function handleChat(userMessage){
    try{
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers:{ 'Content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.1:latest',
                prompt: userMessage,
                stream: false
            })
            });
            if (!response.ok) {
                throw new Error('Ollama error: ${response.statusText}');
            }
            const data = await response.json();
            return data.response; //returns text from LLM
            } catch (err){
                console.error("---Agent Error---");
                console.error(err.message);
                return "Error connecting to Ollama";
            }
        }

module.exports = {handleChat};
