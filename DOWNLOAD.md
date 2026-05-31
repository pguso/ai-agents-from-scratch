Download the models used in this repository

You can adjust the quantization level to balance model precision and file size:
Use `:Q8_0` for higher precision and better output quality, but note that it requires more memory and storage.
Use `:Q6_K` for a good balance between size and accuracy (recommended default).
Use `:Q5_K_S` for a smaller model that loads faster and uses less memory, but with slightly lower precision.

```
npx --no node-llama-cpp pull --dir ./models hf:Qwen/Qwen3-1.7B-GGUF:Q8_0 --filename Qwen3-1.7B-Q8_0.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:giladgd/gpt-oss-20b-GGUF/gpt-oss-20b.MXFP4.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF:Q6_K --filename DeepSeek-R1-0528-Qwen3-8B-Q6_K.gguf
```

```
npx --no node-llama-cpp pull --dir ./models hf:giladgd/Apertus-8B-Instruct-2509-GGUF:Q6_K
```

Example **15 (tool routing)** also needs a small **embedding-only** GGUF (~37MB for Q8_0). Use `--filename` so the path matches the code:

```
npx --no node-llama-cpp pull --dir ./models hf:CompendiumLabs/bge-small-en-v1.5-gguf:bge-small-en-v1.5-q8_0.gguf --filename bge-small-en-v1.5-q8_0.gguf
```

Loading the chat model and this embedding model at once uses more RAM than a single-model example; 8GB+ system RAM is still usually enough for Qwen3-1.7B plus bge-small.


