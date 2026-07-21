# Rubric: Faithfulness Evaluator (LLM-as-judge)

Faithfulness measures whether the generated answer is fully grounded in and supported by the retrieved context chunks, without introducing hallucinations or external assumptions.

## Scoring Rubric
- **1.0 (Faithful)**: All claims, figures, and rules stated in the generated answer are fully and directly supported by the context chunks. There are no hallucinations, no contradictions, and no assumptions.
- **0.0 (Unfaithful)**: The generated answer contains one or more claims, numbers, or rules that are not supported by, or contradict, the context chunks.

## Judge Prompt Template
You are an expert evaluator assessing the faithfulness of a RAG assistant's answer.
Given the Context Blocks and the generated Answer, output ONLY a JSON object:
```json
{
  "score": 1.0 or 0.0,
  "reasoning": "Brief explanation of whether the context fully supports the answer."
}
```
Do not output any other text.
