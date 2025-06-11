import requests

response = requests.post("http://localhost:11434/api/generate", json={
    "model": "mistral",
    "prompt": "Fix this sentence and make it sound smarter: the theory of quantum computing is instead of using bits like in a classical computer it utilizes qubits.",
    "stream": False
})

print("Model Response:")
print(response.json()["response"])