import {
    getLlama,
    LlamaChatSession,
} from "node-llama-cpp";
import {fileURLToPath} from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(
        __dirname,
        "../",
        "models",
        "hf_giladgd_Apertus-8B-Instruct-2509.Q6_K.gguf"
    )
});

const context = await model.createContext();
const session = new LlamaChatSession({
    contextSequence: context.getSequence(),
    systemPrompt: `Du bist ein erfahrener wissenschaftlicher Übersetzer für technische Texte aus dem Englischen ins 
    Deutsche.
    
    Deine Aufgabe: Erstelle eine inhaltlich exakte Übersetzung, die den vollen Sinn und die technische Präzision 
    des Originaltexts erhält.
    
    Gleichzeitig soll die Übersetzung klar, natürlich und leicht lesbar auf Deutsch klingen – also so, wie ein 
    deutscher Wissenschaftler oder Ingenieur denselben Text schreiben würde.
    
    Befolge diese Regeln:
    Bewahre jede fachliche Aussage und Nuance exakt. Kein Inhalt darf verloren gehen oder verändert werden.
    Verwende idiomatisches, flüssiges Deutsch, wie es in wissenschaftlichen Abstracts (z. B. NeurIPS, ICLR, AAAI) üblich ist.
    Vermeide wörtliche Satzstrukturen. Formuliere so, wie ein deutscher Wissenschaftler denselben Inhalt selbst schreiben würde.
    Verwende korrekte Terminologie (z. B. Multi-Agenten-System, Adapterlayer, Baseline, Strategieverbesserung).
    Verwende bei Zahlen, Einheiten und Prozentangaben deutsche Typografie (z. B. „54 %“, „3 m“, „2 000“).
    Passe zusammengesetzte Begriffe an die deutsche Grammatik an (z. B. „kontinuierlich lernendes System“ statt „kontinuierliches Lernen System“).
    Kürze lange oder verschachtelte Sätze behutsam, ohne Bedeutung zu verändern, um Lesbarkeit zu verbessern.
    Verwende einen neutralen, wissenschaftlichen Stil, ohne Werbesprache oder unnötige Ausschmückung.
    
    Zusatzinstruktion:
    Wenn der Originaltext englische Satzlogik enthält, restrukturiere den Satz so, dass er auf Deutsch elegant und klar klingt, aber denselben Inhalt vermittelt.
    
    Zielqualität: Eine Übersetzung, die sich wie ein Originaltext liest – technisch präzise, flüssig und grammatikalisch einwandfrei.
    
    DO NOT add any addition text or explanation. ONLY respond with the translated text
    `
});

const q1 = `Translate this text into german: 

We address the long-horizon gap in large language model (LLM) agents by en-
abling them to sustain coherent strategies in adversarial, stochastic environments.
Settlers of Catan provides a challenging benchmark: success depends on balanc-
ing short- and long-term goals amid randomness, trading, expansion, and block-
ing. Prompt-centric LLM agents (e.g., ReAct, Reflexion) must re-interpret large,
evolving game states each turn, quickly saturating context windows and losing
strategic consistency. We propose HexMachina, a continual learning multi-agent
system that separates environment discovery (inducing an adapter layer without
documentation) from strategy improvement (evolving a compiled player through
code refinement and simulation). This design preserves executable artifacts, al-
lowing the LLM to focus on high-level strategy rather than per-turn reasoning. In
controlled Catanatron experiments, HexMachina learns from scratch and evolves
players that outperform the strongest human-crafted baseline (AlphaBeta), achiev-
ing a 54% win rate and surpassing prompt-driven and no-discovery baselines. Ab-
lations confirm that isolating pure strategy learning improves performance. Over-
all, artifact-centric continual learning transforms LLMs from brittle stepwise de-
ciders into stable strategy designers, advancing long-horizon autonomy.
`;

const a1 = await session.prompt(q1);
console.log("AI: " + a1);

session.dispose()
context.dispose()
model.dispose()
llama.dispose()