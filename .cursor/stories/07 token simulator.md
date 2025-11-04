# Token Simulator Feature - User Story

## Status: Todo

## Overview
The Token Simulator feature enables users to simulate single-agent and multi-agent chat conversations, calculate token counts for each prompt and response, and estimate costs based on GPT-3.5 and GPT-4o pricing. This feature helps users understand the token consumption and cost implications of different conversation architectures, especially in multi-agent systems where token usage can scale exponentially.

## User Story

### Main Story
As a developer or AI architect
I want to simulate chat conversations with single or multiple agents and track token usage and costs
So that I can understand the token consumption patterns and cost implications of different conversation architectures before implementing them

### Supporting Stories

#### Single-Agent Simulation
As a developer
I want to simulate a single-agent chat conversation
So that I can understand the token usage and cost for simple interactions

#### Multi-Agent Simulation
As an AI architect
I want to simulate multi-agent conversations with multiple rounds
So that I can understand how token usage scales in multi-agent systems and plan for cost optimization

#### Cost Analysis
As a project manager
I want to see the cost breakdown for different models (GPT-3.5, GPT-4o)
So that I can make informed decisions about model selection based on budget constraints

## Acceptance Criteria

### Chat Management
- [ ] User can create a new chat (default: 1 agent)
- [ ] User can add agents to a chat (minimum 1, no maximum limit)
- [ ] User can remove agents from a chat (minimum 1 agent must remain)
- [ ] User can name agents with custom names
- [ ] User can edit existing chats (name, agents)
- [ ] User can delete chats with confirmation
- [ ] User can view a list of all chats
- [ ] Chats are persisted in PostgreSQL database

### Round Management
- [ ] User can add a new round to a chat
- [ ] Each round consists of:
  - One prompt (entered manually)
  - One response per agent (entered manually)
- [ ] User can edit existing rounds (prompt and agent responses)
- [ ] User can delete rounds with confirmation
- [ ] Rounds are displayed in chronological order
- [ ] Round number is automatically assigned

### Token Calculation
- [ ] System calculates token count for each prompt using js-tiktoken Lite
- [ ] System calculates token count for each agent response using js-tiktoken Lite
- [ ] System displays token count next to each prompt/response
- [ ] System calculates total input tokens for the chat (sum of all prompts)
- [ ] System calculates total output tokens for the chat (sum of all responses)
- [ ] System calculates total tokens (input + output)
- [ ] Token counts update in real-time as user types

### Cost Calculation
- [ ] System calculates cost for GPT-3.5-turbo-0125:
  - Input: $0.50 / 1M tokens
  - Output: $1.50 / 1M tokens
- [ ] System calculates cost for GPT-4o:
  - Input: $5.00 / 1M tokens
  - Output: $15.00 / 1M tokens
- [ ] System displays cost breakdown (input cost, output cost, total cost)
- [ ] System displays cost for both models side-by-side for comparison
- [ ] Costs update automatically when token counts change

### Multi-Agent Token Calculation
- [ ] For multi-agent conversations, system correctly calculates input tokens:
  - Round 1: prompt tokens × number of agents
  - Round 2+: (initial prompt + all previous responses) × number of agents
- [ ] System displays per-agent token counts
- [ ] System displays per-round token totals
- [ ] System shows how input tokens accumulate across rounds

### User Interface
- [ ] Clean, intuitive interface for managing chats
- [ ] Clear visualization of rounds and agent responses
- [ ] Token counts displayed inline with each prompt/response
- [ ] Summary panel showing totals and costs
- [ ] Responsive design for desktop and mobile
- [ ] Accessibility support (keyboard navigation, screen readers)

### Validation
- [ ] System can replicate the 3-round example from multi-agent-tokens.md:
  - Round 1: 13 tokens × 5 agents = 65 input tokens
  - Round 2: 71 tokens × 5 agents = 355 input tokens
  - Round 3: 117 tokens × 5 agents = 585 input tokens
  - Total: 1005 input tokens, 153 output tokens
  - Cost validation matches documented values

## User Experience Flow

### Creating a New Chat
1. User navigates to Token Simulator page
2. User clicks "Create New Chat" button
3. User enters chat name (optional, defaults to "Chat 1", "Chat 2", etc.)
4. System creates chat with 1 default agent named "Agent 1"
5. User is redirected to chat editor

### Adding Agents
1. User is in chat editor
2. User clicks "Add Agent" button
3. User enters agent name (optional, defaults to "Agent N")
4. System adds agent to chat
5. Agent appears in agent list and becomes available for responses

### Adding a Round
1. User is in chat editor
2. User clicks "Add Round" button
3. User enters prompt text
4. System calculates and displays token count for prompt
5. User enters response for each agent
6. System calculates and displays token count for each response
7. User clicks "Save Round"
8. System saves round and updates totals

### Viewing Token Summary
1. User is in chat editor
2. Summary panel shows:
   - Total input tokens
   - Total output tokens
   - Total tokens
   - GPT-3.5 cost breakdown
   - GPT-4o cost breakdown
3. Summary updates automatically as user adds/modifies rounds

## Validation Example

### Multi-Agent Chat (3 rounds, 5 agents)

#### Round 1
- **Prompt**: "I think we should replace the sensor immediately to avoid any issues." (13 tokens)
- **Input tokens**: 13 × 5 = 65 tokens
- **Agent responses**:
  - Agent 1: "I think we should replace the sensor immediately to avoid any issues." (13 tokens)
  - Agent 2: "I suggest we first run a diagnostic test to determine the fault." (13 tokens)
  - Agent 3: "We might need to recalibrate the sensor instead of replacing it." (11 tokens)
  - Agent 4: "Let's review the sensor's error logs before deciding." (10 tokens)
  - Agent 5: "Perhaps the issue is with the wiring, not the sensor itself." (11 tokens)
- **Output tokens**: 13 + 13 + 11 + 10 + 11 = 58 tokens

#### Round 2
- **Prompt**: Includes all Round 1 responses + initial prompt (71 tokens)
- **Input tokens**: 71 × 5 = 355 tokens
- **Agent responses**:
  - Agent 1: "Replacing the sensor ensures we eliminate the fault quickly." (10 tokens)
  - Agent 2: "Diagnostics can reveal if the sensor really needs replacement." (10 tokens)
  - Agent 3: "Recalibration is cost-effective and might fix the issue." (9 tokens)
  - Agent 4: "Error logs can provide insights into the root cause." (8 tokens)
  - Agent 5: "Checking wiring first can save time if it's not the sensor." (9 tokens)
- **Output tokens**: 10 + 10 + 9 + 8 + 9 = 46 tokens

#### Round 3
- **Prompt**: Includes all Round 1 & 2 responses + initial prompt (117 tokens)
- **Input tokens**: 117 × 5 = 585 tokens
- **Agent responses**:
  - Agent 1: "If diagnostics show a major fault, we can then replace it." (12 tokens)
  - Agent 2: "Agreed, diagnostics first, then decide the next steps." (9 tokens)
  - Agent 3: "Can we perform diagnostics and recalibration simultaneously?" (10 tokens)
  - Agent 4: "Yes, and while doing so, review the error logs." (9 tokens)
  - Agent 5: "And inspect the wiring as a part of the diagnostics." (9 tokens)
- **Output tokens**: 12 + 9 + 10 + 9 + 9 = 49 tokens

#### Totals
- **Total input tokens**: 65 + 355 + 585 = 1,005 tokens
- **Total output tokens**: 58 + 46 + 49 = 153 tokens
- **Total tokens**: 1,158 tokens

#### Cost Calculation (GPT-4o)
- **Input cost**: 1,005 × ($5.00 / 1,000,000) = $0.005025 ≈ $0.01
- **Output cost**: 153 × ($15.00 / 1,000,000) = $0.002295 ≈ $0.00
- **Total cost**: $0.00732 ≈ $0.01

#### Cost Calculation (GPT-3.5-turbo-0125)
- **Input cost**: 1,005 × ($0.50 / 1,000,000) = $0.0005025 ≈ $0.00
- **Output cost**: 153 × ($1.50 / 1,000,000) = $0.0002295 ≈ $0.00
- **Total cost**: $0.000732 ≈ $0.00

## Technical Implementation

### Package Structure

#### Core Package (`@sustainable-ai/core`)
- **Tokenizer Module**: Token counting functionality using js-tiktoken Lite
- **Cost Calculator**: Calculate costs based on model pricing
- **Types**: Shared interfaces for chats, rounds, agents

```typescript
// packages/core/src/tokenizer.ts
import { encoding_for_model } from 'js-tiktoken/lite'

export function countTokens(text: string, model: string = 'gpt-4'): number {
  const encoding = encoding_for_model(model)
  return encoding.encode(text).length
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: 'gpt-3.5-turbo' | 'gpt-4o'
): {
  inputCost: number
  outputCost: number
  totalCost: number
} {
  const pricing = {
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-4o': { input: 5.00, output: 15.00 }
  }
  
  const rates = pricing[model]
  const inputCost = (inputTokens / 1_000_000) * rates.input
  const outputCost = (outputTokens / 1_000_000) * rates.output
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  }
}
```

#### API Package (`@sustainable-ai/api`)
- **Chat Endpoints**: CRUD operations for chats
- **Round Endpoints**: CRUD operations for rounds
- **Token Endpoints**: Token counting and cost calculation endpoints

```typescript
// packages/api/src/routes/chats.ts
router.get('/chats', getAllChats)
router.post('/chats', createChat)
router.get('/chats/:id', getChat)
router.put('/chats/:id', updateChat)
router.delete('/chats/:id', deleteChat)

router.post('/chats/:chatId/rounds', addRound)
router.put('/chats/:chatId/rounds/:roundId', updateRound)
router.delete('/chats/:chatId/rounds/:roundId', deleteRound)

router.post('/tokenizer/count', countTokens)
router.post('/costs/calculate', calculateCosts)
```

#### CLI Package (`@sustainable-ai/cli`)
- **Token Command**: Convert text to token count
- **Cost Command**: Calculate costs for token counts

```typescript
// packages/cli/src/commands/token.ts
program
  .command('token')
  .description('Count tokens in text')
  .argument('<text>', 'Text to count tokens for')
  .option('-m, --model <model>', 'Model to use for tokenization', 'gpt-4')
  .action((text, options) => {
    const count = countTokens(text, options.model)
    console.log(`Token count: ${count}`)
  })

program
  .command('cost')
  .description('Calculate costs for token counts')
  .option('-i, --input <number>', 'Input token count', '0')
  .option('-o, --output <number>', 'Output token count', '0')
  .option('-m, --model <model>', 'Model to calculate costs for', 'gpt-4o')
  .action((options) => {
    const cost = calculateCost(
      parseInt(options.input),
      parseInt(options.output),
      options.model
    )
    console.log(JSON.stringify(cost, null, 2))
  })
```

#### Dashboard Package (`apps/dashboard`)
- **Token Simulator Page**: Main UI for chat simulation
- **Chat List Component**: Display all chats
- **Chat Editor Component**: Edit chat with rounds and agents
- **Token Display Component**: Show token counts inline
- **Cost Summary Component**: Display cost breakdown

### PostgreSQL Database Schema

#### Core Tables
```sql
-- Chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL
);

-- Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Rounds table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, round_number)
);

-- Agent responses table
CREATE TABLE agent_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, agent_id)
);

-- Chat summary view (calculated fields)
CREATE TABLE chat_summaries (
    chat_id UUID PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    gpt35_input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt35_output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt35_total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes for Performance
```sql
-- Chats indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- Agents indexes
CREATE INDEX idx_agents_chat_id ON agents(chat_id);
CREATE INDEX idx_agents_display_order ON agents(chat_id, display_order);

-- Rounds indexes
CREATE INDEX idx_rounds_chat_id ON rounds(chat_id);
CREATE INDEX idx_rounds_round_number ON rounds(chat_id, round_number);

-- Agent responses indexes
CREATE INDEX idx_agent_responses_round_id ON agent_responses(round_id);
CREATE INDEX idx_agent_responses_agent_id ON agent_responses(agent_id);
```

#### Database Functions
```sql
-- Calculate total tokens for a chat
CREATE OR REPLACE FUNCTION calculate_chat_tokens(chat_uuid UUID)
RETURNS TABLE (
    total_input_tokens INTEGER,
    total_output_tokens INTEGER,
    total_tokens INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(r.prompt_tokens), 0)::INTEGER as total_input_tokens,
        COALESCE(SUM(ar.token_count), 0)::INTEGER as total_output_tokens,
        COALESCE(SUM(r.prompt_tokens), 0)::INTEGER + COALESCE(SUM(ar.token_count), 0)::INTEGER as total_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update chat summary
CREATE OR REPLACE FUNCTION update_chat_summary(chat_uuid UUID)
RETURNS VOID AS $$
DECLARE
    input_tokens INTEGER;
    output_tokens INTEGER;
    total_tokens INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(r.prompt_tokens), 0),
        COALESCE(SUM(ar.token_count), 0),
        COALESCE(SUM(r.prompt_tokens), 0) + COALESCE(SUM(ar.token_count), 0)
    INTO input_tokens, output_tokens, total_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
    
    INSERT INTO chat_summaries (
        chat_id,
        total_input_tokens,
        total_output_tokens,
        total_tokens,
        gpt35_input_cost,
        gpt35_output_cost,
        gpt35_total_cost,
        gpt4o_input_cost,
        gpt4o_output_cost,
        gpt4o_total_cost,
        updated_at
    ) VALUES (
        chat_uuid,
        input_tokens,
        output_tokens,
        total_tokens,
        (input_tokens::DECIMAL / 1000000) * 0.50,
        (output_tokens::DECIMAL / 1000000) * 1.50,
        (input_tokens::DECIMAL / 1000000) * 0.50 + (output_tokens::DECIMAL / 1000000) * 1.50,
        (input_tokens::DECIMAL / 1000000) * 5.00,
        (output_tokens::DECIMAL / 1000000) * 15.00,
        (input_tokens::DECIMAL / 1000000) * 5.00 + (output_tokens::DECIMAL / 1000000) * 15.00,
        NOW()
    )
    ON CONFLICT (chat_id) DO UPDATE SET
        total_input_tokens = EXCLUDED.total_input_tokens,
        total_output_tokens = EXCLUDED.total_output_tokens,
        total_tokens = EXCLUDED.total_tokens,
        gpt35_input_cost = EXCLUDED.gpt35_input_cost,
        gpt35_output_cost = EXCLUDED.gpt35_output_cost,
        gpt35_total_cost = EXCLUDED.gpt35_total_cost,
        gpt4o_input_cost = EXCLUDED.gpt4o_input_cost,
        gpt4o_output_cost = EXCLUDED.gpt4o_output_cost,
        gpt4o_total_cost = EXCLUDED.gpt4o_total_cost,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat summary when rounds change
CREATE OR REPLACE FUNCTION trigger_update_chat_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_chat_summary(COALESCE(NEW.chat_id, OLD.chat_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_summary_on_round_change
    AFTER INSERT OR UPDATE OR DELETE ON rounds
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary();

CREATE TRIGGER update_chat_summary_on_response_change
    AFTER INSERT OR UPDATE OR DELETE ON agent_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary();
```

### Multi-Agent Input Token Calculation

For multi-agent conversations, input tokens must account for the accumulation of all previous responses. The calculation logic:

```typescript
// Calculate input tokens for a round in multi-agent conversation
function calculateRoundInputTokens(
  roundNumber: number,
  prompt: string,
  previousRounds: Round[],
  agentCount: number
): number {
  if (roundNumber === 1) {
    // First round: just the prompt
    return countTokens(prompt) * agentCount
  } else {
    // Subsequent rounds: prompt + all previous responses
    let accumulatedText = prompt
    
    // Add all previous prompts and responses
    for (const round of previousRounds) {
      accumulatedText += '\n\n' + round.prompt
      for (const response of round.responses) {
        accumulatedText += '\n\n' + response.text
      }
    }
    
    return countTokens(accumulatedText) * agentCount
  }
}
```

## Dependencies

### Core Package
- `js-tiktoken` (Lite version): Token counting
- `@sustainable-ai/types`: Shared TypeScript types

### API Package
- `@sustainable-ai/core`: Token counting and cost calculation
- `@sustainable-ai/types`: Shared types
- `express`: Web framework
- `pg`: PostgreSQL client

### CLI Package
- `@sustainable-ai/core`: Token counting and cost calculation
- `commander`: CLI framework

### Dashboard Package
- `@sustainable-ai/core`: Token counting and cost calculation
- `@sustainable-ai/types`: Shared types
- Vue 3 Composition API components

## Success Metrics

### User Engagement
- Number of chats created per user
- Average number of rounds per chat
- Average number of agents per chat
- Frequency of cost calculations

### Validation Accuracy
- Token counts match js-tiktoken Lite within 1 token
- Cost calculations match documented pricing exactly
- Multi-agent validation matches example from multi-agent-tokens.md

### Performance
- Token counting completes in < 50ms
- Cost calculation completes in < 10ms
- Database queries complete in < 100ms

## Edge Cases

### Token Counting
- Empty strings (0 tokens)
- Very long text (handle gracefully)
- Special characters and emojis
- Multilingual text

### Multi-Agent Logic
- Adding agents mid-conversation (recalculate input tokens)
- Removing agents mid-conversation (handle orphaned responses)
- Changing agent names (preserve history)
- Reordering rounds (maintain correct token calculations)

### Cost Calculation
- Zero tokens (no cost)
- Very large token counts (handle precision)
- Rounding for display (2-4 decimal places)

### Database
- Concurrent updates to same chat
- Cascading deletes (chat → rounds → responses)
- Transaction rollback on errors

## Future Enhancements

### Advanced Features
- Import/export chats as JSON
- Duplicate chat functionality
- Chat templates for common scenarios
- Batch cost calculation for multiple chats
- Historical cost tracking over time

### Analytics
- Token usage trends
- Cost comparison charts
- Agent response length analysis
- Round-by-round token growth visualization

### Integration
- Export to CSV for reporting
- Integration with actual LLM APIs for comparison
- Share chat simulations with team members
- Version history for chats

## Business Value

### For Developers
- Understand token consumption patterns before implementation
- Estimate costs for different conversation architectures
- Optimize multi-agent system design for cost efficiency
- Validate token counting accuracy

### For Project Managers
- Budget planning for AI projects
- Cost comparison between different models
- ROI analysis for multi-agent systems
- Resource allocation decisions

### For Organizations
- Cost awareness and optimization
- Sustainability impact assessment
- Architecture decision support
- Training and education tool

