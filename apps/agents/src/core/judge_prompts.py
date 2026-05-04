STYLE_NORMALIZER_PROMPT = (
    "You are a text normalizer. Convert the following response into a standardized format:\n"
    "- Convert bullet points to consistent markdown unordered lists (- item)\n"
    "- Normalize code blocks to use triple backticks with language identifiers\n"
    "- Convert numbered lists to 1. 2. 3. format\n"
    "- Preserve all substantive content exactly as written\n"
    "- Do not add, remove, or rephrase any claims or arguments\n"
    "- Output ONLY the normalized text, nothing else\n\n"
    "Response to normalize:\n{response}"
)

CLAIM_EXTRACTION_PROMPT = (
    "You are a precise claim extractor. Analyze the following response and extract every "
    "distinct factual claim, recommendation, code suggestion, or substantive assertion.\n\n"
    "RULES:\n"
    "- Extract EVERY individual claim, no matter how small\n"
    "- Each claim must be a single, atomic assertion\n"
    "- Do NOT summarize or merge claims\n"
    "- Do NOT say 'the response generally agrees' or 'all points align'\n"
    "- If the response contains code, extract each code-level decision as a separate claim\n"
    "- Classify each claim's specificity as 'high' (concrete, measurable), 'medium' (directional), "
    "or 'low' (vague, generic)\n"
    "- Classify evidence level as 'strong' (cites sources, provides code, gives examples), "
    "'moderate' (explains reasoning), or 'weak' (bare assertion)\n\n"
    "Response from {label}:\n{response}\n\n"
    "Original question: {question}\n\n"
    "Output STRICTLY as JSON with NO surrounding text:\n"
    '{{"claims": [{{"id": "C1", "text": "...", "specificity": "high|medium|low", '
    '"evidence": "strong|moderate|weak", "category": "factual|recommendation|code|opinion"}}]}}'
)

CROSS_REFERENCE_PROMPT = (
    "You are an analytical cross-referencing engine. Below are extracted claims from multiple "
    "anonymous debate participants. Your task is to classify the relationship between ALL pairs "
    "of claims across different participants.\n\n"
    "RULES:\n"
    "- Compare EVERY claim from each participant against EVERY claim from every other participant\n"
    "- Do NOT skip any comparisons\n"
    "- Do NOT say 'all claims agree' - you must enumerate specific relationships\n"
    "- A claim with no match in another participant's claims is 'unique'\n\n"
    "RELATIONSHIP TYPES:\n"
    "- 'agreement': Claims make the same assertion (even if worded differently)\n"
    "- 'partial_agreement': Claims overlap but differ in scope or detail\n"
    "- 'contradiction': Claims make opposing assertions\n"
    "- 'complementary': Claims address different aspects of the same sub-topic\n"
    "- 'unique': Claim has no counterpart in the other participant's claims\n\n"
    "Claims by participant:\n{claims_by_participant}\n\n"
    "Output STRICTLY as JSON with NO surrounding text:\n"
    '{{"agreements": [{{"claim_a": "{label_a}:C1", "claim_b": "{label_b}:C2", '
    '"type": "agreement|partial_agreement", "summary": "..."}}], '
    '"contradictions": [{{"claim_a": "{label_a}:C1", "claim_b": "{label_b}:C2", '
    '"type": "contradiction", "summary": "..."}}], '
    '"unique_claims": [{{"claim": "{label_a}:C1", "summary": "..."}}]}}'
)

DISPUTE_RESOLUTION_PROMPT = (
    "You are a rigorous dispute resolver. Two anonymous debate participants have made "
    "contradictory claims. Analyze both positions step by step.\n\n"
    "RULES:\n"
    "- Consider the strength of evidence each side provides\n"
    "- Consider technical accuracy and logical consistency\n"
    "- Do NOT default to 'both are right' - pick a winner or explain the precise conditions "
    "under which each is correct\n"
    "- Provide step-by-step chain-of-thought reasoning\n\n"
    "Original question: {question}\n\n"
    "Claim from {label_a}: {claim_a}\n"
    "Claim from {label_b}: {claim_b}\n"
    "Dispute summary: {summary}\n\n"
    "Output STRICTLY as JSON with NO surrounding text:\n"
    '{{"reasoning": ["step 1...", "step 2...", "..."], '
    '"winner": "{label_a}|{label_b}|conditional", '
    '"confidence": 0.0-1.0, '
    '"resolution": "concise statement of the resolved position", '
    '"conditions": "if conditional, when each position applies (otherwise null)"}}'
)

SYNTHESIS_PROMPT_WEB = (
    "You are producing the GOLDEN PROMPT - the single definitive answer to the user's question. "
    "You have access to scored claims from multiple AI models and resolved disputes.\n\n"
    "REQUIREMENTS:\n"
    "- Produce a clear, well-structured answer the user can directly use\n"
    "- Cite which participants' insights you incorporated using their labels "
    "(e.g., 'As noted by Response A and confirmed by Response C')\n"
    "- Prioritize reasoning quality, logical consistency, and completeness\n"
    "- Resolve any remaining ambiguity with clear explanations\n"
    "- Do NOT mention the debate process, scoring, or claim extraction\n"
    "- Do NOT hedge unnecessarily - commit to the best-supported position\n"
    "- Structure with headers, lists, and paragraphs as appropriate\n\n"
    "Original question: {question}\n\n"
    "Scored claims and resolutions:\n{scored_data}\n\n"
    "Participant label mapping for citations:\n{label_mapping}\n\n"
    "Produce the definitive answer now."
)

SYNTHESIS_PROMPT_CLI = (
    "You are producing the GOLDEN PROMPT - the single definitive answer to the user's question. "
    "You have access to scored claims from multiple AI models and resolved disputes.\n\n"
    "REQUIREMENTS:\n"
    "- Produce a clear, well-structured answer optimized for technical correctness\n"
    "- Prioritize code correctness, performance, and best practices\n"
    "- Include working code examples where relevant\n"
    "- Cite which participants' insights you incorporated using their labels "
    "(e.g., 'As noted by Response A')\n"
    "- Resolve any remaining ambiguity with concrete code or configuration\n"
    "- Do NOT mention the debate process, scoring, or claim extraction\n"
    "- Do NOT hedge - commit to the best-supported implementation\n"
    "- Use markdown code blocks with language identifiers\n\n"
    "Original question: {question}\n\n"
    "Scored claims and resolutions:\n{scored_data}\n\n"
    "Participant label mapping for citations:\n{label_mapping}\n\n"
    "Produce the definitive answer now."
)

EMERGENCY_SYNTHESIS_PROMPT = (
    "You are an expert AI assistant. Multiple AI models were asked the same question and "
    "provided different responses. Synthesize them into a single, definitive answer.\n\n"
    "RULES:\n"
    "- Identify points of agreement across responses\n"
    "- Where responses disagree, pick the position with stronger reasoning\n"
    "- Produce a clear, actionable answer\n"
    "- Do NOT mention that multiple models were consulted\n"
    "- Cite insights using participant labels (e.g., 'Response A')\n\n"
    "Original question: {question}\n\n"
    "Responses:\n{responses}\n\n"
    "Participant label mapping: {label_mapping}\n\n"
    "Produce the definitive answer now."
)
