# What are the costs?
The costs on paper may not seem high, but they can mount up especially in multi-agent systems. Let’s explore the costs a little.

Here are the costs of two common models offered by OpenAI. You can see that there are substantial differences in cost between the two models (prices correct August 2024).

```csv
Model	Pricing	Pricing with Batch API
GPT-3.5-turbo-0125  	$0.50 / 1M input tokens $1.50 / 1M output tokens	$0.25 / 1M input tokens $0.75 / 1M output tokens
GPT-4o	$5.00 / 1M input tokens $15.00 / 1M output tokens	$2.50 / 1M input tokens $7.50 / 1M output tokens
```
Source: https://openai.com/api/pricing

# What do tokens look like in reality and how do they count up?
Here is a single-agent example with a total of 13 input tokens and 15 output tokens, which is not many:

```
Prompt: “I think we should replace the sensor immediately to avoid any issues.” (13 tokens)
Answer: “I agree, let’s replace the sensor right away to prevent any problems.” (15 tokens)
```

Here is a multi-agent example with a total of 1005 input tokens (approximately 77 times as many as the single-agent example because of the need to input the responses of all agents to all agents each round) and 153 output tokens (around 10 times as many as the single-agent example):

```
Round 1 prompt: “I think we should replace the sensor immediately to avoid any issues.” (13 tokens × 5 agents = 65 tokens)
Round 1 answers: Initial opinions

Agent 1: “I think we should replace the sensor immediately to avoid any issues.” (13 tokens)
Agent 2: “I suggest we first run a diagnostic test to determine the fault.” (13 tokens)
Agent 3: “We might need to recalibrate the sensor instead of replacing it.” (11 tokens)
Agent 4: “Let’s review the sensor’s error logs before deciding.” (10 tokens)
Agent 5: “Perhaps the issue is with the wiring, not the sensor itself.” (11 tokens)
```

```
Round 2 prompt: Includes all the past answers from round 1 and the initial prompt (71 tokens × 5 agents = 355 tokens).
Round 2 answers: Arguments and counterarguments

Agent 1: “Replacing the sensor ensures we eliminate the fault quickly.” (10 tokens)
Agent 2: “Diagnostics can reveal if the sensor really needs replacement.” (10 tokens)
Agent 3: “Recalibration is cost-effective and might fix the issue.” (9 tokens)
Agent 4: “Error logs can provide insights into the root cause.” (8 tokens)
Agent 5: “Checking wiring first can save time if it’s not the sensor.” (9 tokens)
```

```
Round 3 prompt: Includes all the past answers from rounds 1 and 2 and the initial prompt (117 tokens × 5 agents = 585 tokens).
Round 3 answers: Further discussion and attempt to reach consensus.

Agent 1: “If diagnostics show a major fault, we can then replace it.” (12 tokens)
Agent 2: “Agreed, diagnostics first, then decide the next steps.” (9 tokens)
Agent 3: “Can we perform diagnostics and recalibration simultaneously?” (10 tokens)
Agent 4: “Yes, and while doing so, review the error logs.” (9 tokens)
Agent 5: “And inspect the wiring as a part of the diagnostics.” (9 tokens)
```

# Conclusions and the challenges of scale
We can see that the multi-agent example uses 1005 input tokens and 153 output tokens, which is a huge increase on the 13 input tokens and 15 output tokens of the single agent. While the value of the multi-agent system may be worth the extra cost for the additional value in response, we can see that costs can increase quickly when they are determined by token volume, and therefore, the architectural design of multi-agent systems should consider this spiralling token use and cost. This becomes a much bigger issue when we have proactive agents seeking out work and having discussions with each other frequently.

If we have one sensor and we need to make a decision every one minute, what do these costs look like?  

## Single-agent (tokens per day and cost):
Input tokens: 13 × 60 × 24 = 18,720 (GPT-4o non-API 18,720 * ($5 / 1,000,000) = $0.09)
Output tokens: 15 × 60 × 24 = 21,600 (GPT-4o non-API 21,600 * ($15 / 1,000,000) = $0.32)
## Multi-agent (tokens per day and cost):
Input tokens: 1005 × 60 × 24 = 1,447,200 (GPT-4o non-API 1,447,200 * ($5 / 1,000,000) = $7.24)
Output tokens: 153 × 60 × 24 = 220,320 (GPT-4o non-API 220,320 * ($15 / 1,000,000) = $3.30)